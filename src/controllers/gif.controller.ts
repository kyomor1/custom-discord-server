import { Request, Response } from 'express';

export async function searchGifs(req: Request, res: Response) {
  try {
    const rawQuery = (req.query.q as string || '').trim().toLowerCase();
    const q = rawQuery ? rawQuery.replace(/\s+/g, '-') : 'trending';
    const targetUrl = `https://tenor.com/search/${encodeURIComponent(q)}-gifs`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.json({ gifs: [] });
    }

    const html = await response.text();
    const regex = /https:\/\/media\.tenor\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.gif/g;
    const matches = Array.from(new Set(html.match(regex) || []));
    return res.json({ gifs: matches });
  } catch (err: any) {
    console.error('GIF route error:', err);
    return res.json({ gifs: [] });
  }
}
