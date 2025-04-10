export enum Role {
  admin = 'admin',
  user = 'user',
  customer = 'customer',
  expert = 'expert',
  directorate = 'directorate',
}

export enum UserAccountStatus {
  active = 'active',
  pending = 'pending',
  inactive = 'inactive',
}

export enum UserCommandStatus {
  inTeam = 'In the team',
  expelled = 'Expelled',
}
    
export enum StatusProject {
  draft = 'Draft',
  searchTeam = 'Search for team',
  selectionTeam = 'Team selection',
  teamFound = 'Team found',
}
    
export enum StatusIdea {
  draft = 'Draft',
  new = 'New',
  underEditing = 'Under Editing',
  underApproval = 'Under Approval',
  approved = 'Approved',
  endorsed = 'Endorsed',
  published = 'Published',
  implemented = 'Implemented',
}
    
export enum StatusTeam {
  searchProject = 'Поиск проекта',
  inProgress = 'В процессе работы',
  joinProject = 'Подана на проект',
  delete = 'На удалении',
}
    
export enum PrivacyTeam {
  open = 'Open',
  close = 'Close',
}
    
export enum Competence {
  no = 'No',
  html = 'HTML',
  typescript = 'TypeScript',
  postgresql = 'PostgeSQL',
}

export enum TaskStatus {
  new = 'new',
  inProgress = 'inProgress',
  done = 'done',
}
  
export interface LoginResponseDto {
  access_token: string;
  username: string;
  firstname: string;
  lastname: string;
  roles: Role[];
  userId: number;
}

export interface SignUpRequestDto {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
}

export interface SignupResponseDto {
  success: boolean;
}

export interface CreateUserDto {
  name: string;
  firstname: string;
  lastname: string;
  password: string;
  roles: Role[];
  status: UserAccountStatus;
}

export interface UpdateUserDto {
  id?: number;
  email?: string;
  firstname?: string;
  lastname?: string;
  group?: string;
  telephone?: string;
  roles?: Role[];
  status?: UserAccountStatus;
  competence?: Competence[];
  team_leader?: number;
  team_owner?: number[];
  portfolio?: number[];
  idea_initiator?: number[];
  project_initiator?: number[];
  comment?: number[]
  team?: number | null;
}

export interface CreateProjectDto {
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
  stack: Competence[];
  status: StatusProject;
  startProject: Date;
  stopProject: Date;
  maxUsers: string;
  customer: string;
  initiator: number;
}

export interface UpdateProjectDto {
  name?: string;
  problem?: string;
  solution?: string;
  result?: string;
  resource?: string;
  stack?: Competence[];
  status?: StatusProject;
  startProject?: Date;
  stopProject?: Date;
  maxUsers?: string;
  customer?: string;
  exchange?: string;
  initiator?: number;
}

export interface CreateExchangeDto {
  name: string;
  startExchange: Date;
  stopExchange: Date;
}

export interface UpdateExchangeDto {
  name?: string;
  startExchange?: Date;
  stopExchange?: Date;
  projects?: ProjectDto[];
}

export interface CreateIdeaDto {
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
  stack: Competence[]; 
  status: StatusIdea;
  comment: number[]; 
  initiator: number;
}

export interface UpdateIdeaDto {
  name?: string;
  problem?: string;
  solution?: string;
  result?: string;
  resource?: string;
  stack?: Competence[]; 
  status?: StatusIdea;
  approved?: number[];
  comment?: number[]; 
  initiator?: number;
}

export interface CreateCommentDto {
  comment: string;
  users: number;
  idea: number;
}

export interface UpdateCommentDto {
  comment?: string;
  users?: number;
  idea?: number;
}

export interface CreateTeamDto {
  name: string,        
  description: string,        
  privacy: PrivacyTeam,    
  status: StatusTeam,
  user_leader: number,
  user: number[],
  project: number | null,
  user_owner: number,
}

export interface UpdateTeamDto {
  name?: string,        
  description?: string,        
  privacy?: PrivacyTeam,    
  status?: StatusTeam,
  user_leader?: number | null,
  user?: number[],
  project?: number | null,
  user_owner?: number,
}

export interface CreatePortfolioDto {
  status: UserCommandStatus;
  team: number;
  user: number;
}

export interface UpdatePortfolioDto {
  status: UserCommandStatus;
  team: number;
  user: number;
}

export type SecuredUser = {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  group: string;
  telephone: string;
  roles: Role[];
  status: UserAccountStatus;
  competence: Competence[];
  team_leader: TeamDto | null;
  team_owner: TeamDto[];
  portfolio: PortfolioDto[];
  idea_initiator: IdeaDto[];
  project_initiator: ProjectDto[];
  comment: CommentDto[]
  team: TeamDto | null;
};

export type TaskDto = {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  author: SecuredUser;
  assignee?: any;
};

export type ProjectDto = {
  id: number;
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
  stack: Competence[]; 
  status: StatusProject; 
  startProject: Date;
  stopProject: Date;
  maxUsers: string;
  exchange: ExchangeDto;
  teams: TeamDto[];
  customer: string; 
  initiator: SecuredUser; 
};

export type ExchangeDto = {
  id: number;
  name: string;
  startExchange: Date;
  stopExchange: Date;
  projects: ProjectDto[];
};

export type IdeaDto = {
  id: number;
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
  stack: Competence[]; 
  status: StatusIdea; 
  createdAt: Date; 
  approved: number[];
  comment: CommentDto[]; 
  initiator: SecuredUser;
};

export type CommentDto = {
  id: number;
  createdAt: Date; 
  comment: string;
  users: SecuredUser;
  idea: IdeaDto;
};

export type TeamDto = {
  id: number;  
  name: string;
  description: string; //описание
  privacy: PrivacyTeam;
  status: StatusTeam;
  user_leader: SecuredUser;
  user: SecuredUser[];
  portfolio: PortfolioDto[];
  project: ProjectDto | null;
  user_owner: SecuredUser; //владелец
}

export type PortfolioDto = {
  id: number;
  entryDate: Date;
  exclusionDate: Date;
  status: UserCommandStatus;
  team: TeamDto;
  user: SecuredUser;
}

export type CreateUpdateTaskDto = Omit<TaskDto, 'id' | 'createdAt' | 'author'>;