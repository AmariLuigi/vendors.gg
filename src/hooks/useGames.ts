import { useState, useEffect } from 'react';

export interface GameCategory {
  id: string;
  name: string;
  description: string | null;
  subcategories: GameSubcategory[];
}

export interface GameSubcategory {
  id: string;
  name: string;
  description: string | null;
}

export interface GameServer {
  id: string;
  name: string;
  region: string | null;
  type: string | null;
}

export interface GameLeague {
  id: string;
  name: string;
  displayName: string | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  metadata: any;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  hasServers: boolean;
  hasLeagues: boolean;
  metadata: any;
  categories?: GameCategory[];
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/games');
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
        const data = await response.json();
        setGames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return { games, loading, error };
}

export function useGameCategories(gameId: string | null) {
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setCategories([]);
      setGame(null);
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/games/${gameId}/categories`);
        if (!response.ok) {
          throw new Error('Failed to fetch game categories');
        }
        const data = await response.json();
        setGame(data.game);
        setCategories(data.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [gameId]);

  return { categories, game, loading, error };
}

export function useGameServers(gameId: string | null) {
  const [servers, setServers] = useState<GameServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setServers([]);
      return;
    }

    const fetchServers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/games/${gameId}/servers`);
        if (!response.ok) {
          throw new Error('Failed to fetch game servers');
        }
        const data = await response.json();
        setServers(data.servers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, [gameId]);

  return { servers, loading, error };
}

export function useGameLeagues(gameId: string | null) {
  const [leagues, setLeagues] = useState<GameLeague[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLeagues([]);
      return;
    }

    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/games/${gameId}/leagues`);
        if (!response.ok) {
          throw new Error('Failed to fetch game leagues');
        }
        const data = await response.json();
        setLeagues(data.leagues);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [gameId]);

  return { leagues, loading, error };
}