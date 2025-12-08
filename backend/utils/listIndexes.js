require('dotenv').config();
const mongoose = require('mongoose');

const listIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Conectado a MongoDB');

    const database = mongoose.connection.db;
    const indexes = await database.collection('users').indexes();

    console.log('Índices en la colección `users`:');
    console.log(JSON.stringify(indexes, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error listando índices:', err);
    process.exit(1);
  }
};

listIndexes();
