import { Request, Response } from 'express';
import Parser from 'rss-parser';

interface FeedSource {
  nombre: string;
  url: string;
}

const FUENTES: FeedSource[] = [
  { nombre: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { nombre: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { nombre: 'Decrypt', url: 'https://decrypt.co/feed' },
];

const MAX_ITEMS = 40;

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoinHubBot/1.0)' },
});

export interface NewsItem {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  fuente: string;
  url: string | undefined;
  imagen: string | null;
  moneda: string;
}

function limpiarDescripcion(html: string | undefined, fallback: string): string {
  if (!html) return fallback;
  const texto = html.replace(/<[^>]*>/g, '').trim();
  return texto || fallback;
}

function extraerImagen(item: Parser.Item): string | null {
  const enclosureUrl = (item as { enclosure?: { url?: string } }).enclosure?.url;
  if (enclosureUrl) return enclosureUrl;

  const contentHtml = (item as { content?: string })['content'] ?? item.contentSnippet;
  const match = contentHtml?.match(/<img[^>]+src="([^">]+)"/);
  return match?.[1] ?? null;
}

async function obtenerFeed(fuente: FeedSource): Promise<NewsItem[]> {
  const feed = await parser.parseURL(fuente.url);

  return (feed.items ?? []).map((item) => ({
    id: item.guid ?? item.link ?? `${fuente.nombre}-${item.title}`,
    titulo: item.title ?? 'Sin título',
    descripcion: limpiarDescripcion(item.contentSnippet ?? item.content, item.title ?? ''),
    fecha: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
    fuente: fuente.nombre,
    url: item.link,
    imagen: extraerImagen(item),
    moneda: 'General',
  }));
}

export async function getNews(_req: Request, res: Response): Promise<void> {
  const resultados = await Promise.allSettled(FUENTES.map(obtenerFeed));

  const items = resultados
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Error leyendo el feed de ${FUENTES[i]!.nombre}:`, r.reason);
    }
  });

  if (items.length === 0) {
    res.status(502).json({ error: 'No se pudo obtener noticias de ninguna fuente.' });
    return;
  }

  items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  res.status(200).json({ items: items.slice(0, MAX_ITEMS) });
}
