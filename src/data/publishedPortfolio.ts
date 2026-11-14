import type { PortfolioProfile } from '../types/portfolio';
import rootData from '../../data.json';

export interface PublishedPortfolioBundle {
  initialized: boolean;
  version: number;
  updatedAt: string;
  activePortfolioId: string;
  portfolios: PortfolioProfile[];
}

const rawBundle = rootData as Partial<PublishedPortfolioBundle>;

export const PUBLISHED_PORTFOLIO_SNAPSHOT: PublishedPortfolioBundle = {
  initialized: Boolean(
    rawBundle?.initialized &&
      Array.isArray(rawBundle?.portfolios) &&
      rawBundle.portfolios.length > 0
  ),
  version: typeof rawBundle?.version === 'number' ? rawBundle.version : 1,
  updatedAt: typeof rawBundle?.updatedAt === 'string' ? rawBundle.updatedAt : '',
  activePortfolioId:
    typeof rawBundle?.activePortfolioId === 'string' && rawBundle.activePortfolioId
      ? rawBundle.activePortfolioId
      : 'default_portfolio',
  portfolios: Array.isArray(rawBundle?.portfolios) ? rawBundle.portfolios : []
};
