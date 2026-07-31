import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import type { Types } from 'mongoose';
import connectDB from '../config/db';

import User from '../API/models/User';
import Post from '../API/models/Post';
import Comment from '../API/models/Comment';
import Resource from '../API/models/Resource';
import type { UserRole, PostCategory, ResourceType, ResourceCategory } from '../types/models';

type CsvRow = Record<string, string>;

function readCSV(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data: CsvRow) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    await connectDB();

    console.log('🗑️  Limpiando colecciones existentes...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Resource.deleteMany({});
    console.log('✅ Colecciones limpiadas\n');

    const dataDir = path.join(__dirname, 'data');
    const usersCSV = path.join(dataDir, 'users.csv');
    const postsCSV = path.join(dataDir, 'posts.csv');
    const commentsCSV = path.join(dataDir, 'comments.csv');
    const resourcesCSV = path.join(dataDir, 'resources.csv');

    console.log('👥 Cargando usuarios...');
    const usersData = await readCSV(usersCSV);
    const users = await User.insertMany(
      usersData.map((user) => ({
        username: user['username'].trim(),
        email: user['email'].trim(),
        password: user['password'].trim(),
        avatar: user['avatar']?.trim() || null,
        wallet_address: user['wallet_address']?.trim() || null,
        role: (user['role']?.trim() || 'user') as UserRole,
      }))
    );
    console.log(`✅ ${users.length} usuarios cargados`);

    const userIdMap: Record<number, Types.ObjectId> = {};
    for (let i = 0; i < users.length; i++) {
      userIdMap[i + 1] = users[i]._id;
    }

    console.log('\n📝 Cargando posts...');
    const postsData = await readCSV(postsCSV);
    const posts = await Post.insertMany(
      postsData.map((post) => {
        const userId = parseInt(post['userId'], 10);
        const mappedUserId = userIdMap[userId] ?? userIdMap[((userId - 1) % 15) + 1];

        if (!mappedUserId) {
          console.warn(`⚠️  userId ${userId} no encontrado, usando fallback`);
        }

        let likesArray: Types.ObjectId[] = [];
        if (post['likes']) {
          try {
            const parsedLikes = JSON.parse(post['likes']) as string[];
            likesArray = parsedLikes
              .map((id) => userIdMap[parseInt(id, 10)])
              .filter((id) => id !== undefined);
          } catch {
            console.warn(`⚠️  Error parseando likes para post "${post['title']}"`);
          }
        }

        return {
          userId: mappedUserId,
          title: post['title'].trim(),
          content: post['content'].trim(),
          category: post['category'].trim() as PostCategory,
          image: post['image']?.trim() || null,
          likes: likesArray,
        };
      })
    );
    console.log(`✅ ${posts.length} posts cargados`);

    const postIdMap: Record<number, Types.ObjectId> = {};
    for (let i = 0; i < posts.length; i++) {
      postIdMap[i + 1] = posts[i]._id;
    }

    console.log('\n💬 Cargando comentarios...');
    const commentsData = await readCSV(commentsCSV);
    const comments = await Comment.insertMany(
      commentsData.map((comment) => {
        const postId = parseInt(comment['postId'], 10);
        const userId = parseInt(comment['userId'], 10);

        return {
          postId: postIdMap[postId],
          userId: userIdMap[userId],
          content: comment['content'].trim(),
        };
      })
    );
    console.log(`✅ ${comments.length} comentarios cargados`);

    console.log('\n📚 Cargando recursos...');
    const resourcesData = await readCSV(resourcesCSV);
    const resources = await Resource.insertMany(
      resourcesData.map((resource) => {
        const userId = parseInt(resource['userId'], 10);

        return {
          userId: userIdMap[userId],
          title: resource['title'].trim(),
          description: resource['description'].trim(),
          type: resource['type'].trim() as ResourceType,
          fileUrl: resource['fileUrl'].trim(),
          category: resource['category'].trim() as ResourceCategory,
        };
      })
    );
    console.log(`✅ ${resources.length} recursos cargados`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(50));
    console.log(`👥 Usuarios:    ${users.length}`);
    console.log(`📝 Posts:       ${posts.length}`);
    console.log(`💬 Comentarios: ${comments.length}`);
    console.log(`📚 Recursos:    ${resources.length}`);
    console.log('─'.repeat(50));
    console.log(`📊 TOTAL:       ${users.length + posts.length + comments.length + resources.length} registros`);
    console.log('='.repeat(50) + '\n');

    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

seedDatabase();
