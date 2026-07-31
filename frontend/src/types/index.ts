export type { UserRole, User, PopulatedUser } from './user';
export type { Coin, CoinEnriched } from './coin';
export type { PostCategory, Post } from './post';
export type { Comment } from './comment';
export type { ResourceType, ResourceCategory, Resource } from './resource';
export type { PortfolioItem, LocalPortfolioEntry } from './portfolio';
// ApiError es una clase (valor + tipo), no puede exportarse con `export type`
export { ApiError } from './api';
export type { RequestOptions, PaginatedResponse } from './api';
