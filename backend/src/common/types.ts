export enum Role {
  admin = 'admin',
  user = 'user',
  customer = 'customer',
  expert = 'expert',
  directorate = 'directorate',
}

export enum UserAccountStatus {
  active = 'active', //пользователи без команды и в команде, остальные не юзеры
  pending = 'pending', //пользователи подавшие заявку в команду, но не одобренные
  inactive = 'inactive',
}

export enum UserCommandStatus {
  inTeam = 'In the team',
  expelled = 'Expelled',
  team_deleted = 'Team deleted',
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
  approved = 'Approved',
  endorsed = 'Endorsed',
  published = 'Published',
  implemented = 'Implemented',
  fordeletion = 'Fordeletion',
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

export enum TypeAgile {
  backlog = 'Backlog',
  sprintBacklog = 'Sprint backlog',
  inProgress = 'In progress',
  completed = 'Completed',
}
    
// types.ts
export const Competencies = {
  // Языки программирования
  LANGUAGES: [
    'No',
    'PHP',
    'Blueprint',
    'GOLANG',
    'Rust',
    'Dart',
    'R',
    'Java',
    'JavaScript',
    'HTML',
    'CSS',
    'C++',
    'TypeScript',
    'Python',
    'Swift',
    'Kotlin',
    'C#',
    'Ruby',
    'Julia'
  ] as const,

  // Фреймворки и библиотеки
  FRAMEWORKS: [
    'React',
    'Vue',
    'Angular',
    'Spring Boot',
    'Flutter',
    'Django',
    'Flask',
    'Ruby on Rails',
    '.NET',
    'TensorFlow',
    'PyTorch',
    'Keras',
    'Pandas',
    'NumPy',
    'Node.js',
    'Express',
    'Next.js',
    'NestJS',
    'React Native',
    'Xamarin'
  ] as const,

  // Базы данных
  DATABASES: [
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'SQLite',
    'Redis',
    'Firebase',
    'Elasticsearch',
    'SQL Server',
    'Oracle',
    'Cassandra'
  ] as const,

  // DevOps и инструменты
  DEVOPS: [
    'Docker',
    'Kubernetes',
    'Git',
    'CI/CD',
    'Jenkins',
    'Ansible',
    'Terraform',
    'Prometheus',
    'Grafana',
    'AWS',
    'Azure',
    'GCP',
    'Nginx',
    'Apache'
  ] as const,

  // Тестирование
  TESTING: [
    'Jest',
    'Mocha',
    'Cypress',
    'Selenium',
    'JUnit',
    'PyTest',
    'Cucumber',
    'Postman'
  ] as const,

  // Дизайн и UX
  DESIGN: [
    'Figma',
    'Sketch',
    'Adobe XD',
    'Photoshop',
    'Illustrator',
    'UI/UX Design',
    'Prototyping'
  ] as const,

  MOBILE: [
    'Flutter',
    'React Native',
    'Swift',
    'Kotlin',
    'Ionic'
  ] as const
} as const;

// Тип для отдельной компетенции
export type Competence = typeof Competencies[keyof typeof Competencies][number];

// Тип для группы компетенций
export type CompetenceGroup = keyof typeof Competencies;

// Вспомогательный тип для фильтрации
export type CompetenceByGroup<T extends CompetenceGroup> = typeof Competencies[T][number];

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
  avatar_id?: string;
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
  comment?: number[];
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

export interface CreateAgileDto {
  name: string;
  type: TypeAgile;
  project: number;
}

export interface UpdateAgileDto {
  name?: string;
  type?: TypeAgile;
  project?: number;
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
  projects?: number[];
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

export interface CreateMessageDto {
  message: string;
  users: number;
  agile: number;
}

export interface UpdateMessageDto {
  message?: string;
  users?: number;
  agile?: number;
}

export interface CreateTeamDto {
  name: string,        
  description: string,        
  privacy: PrivacyTeam,    
  status: StatusTeam,
  user_leader: number | undefined,
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
  entryDate?: Date;
  exclusionDate?: Date | null; 
  team: number;
  user: number;
}

export interface UpdatePortfolioDto {
  status: UserCommandStatus;
  entryDate?: Date;
  exclusionDate?: Date; 
  team?: number | null;
  user?: number;
}

export type SecuredUser = {
  id: number;
  avatar_id: string;
  email: string;
  firstname: string;
  lastname: string;
  group: string;
  telephone: string;
  roles: Role[];
  status: UserAccountStatus;
  competence: Competence[];
  createdAt: Date;
  team_leader: TeamDto | null;
  team_owner: TeamDto[];
  portfolio: PortfolioDto[];
  idea_initiator: IdeaDto[];
  project_initiator: ProjectDto[];
  comment: CommentDto[];
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
  agile: AgileDto[];
  customer: string; 
  initiator: SecuredUser; 
};

export type AgileDto = {
  id: number;
  name: string;
  type: TypeAgile;
  createdAt: Date;
  project: ProjectDto;
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

export type MessageDto = {
  id: number;
  createdAt: Date; 
  message: string;
  users: SecuredUser;
  agile: AgileDto;
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
  project?: ProjectDto | null;
  user_owner: SecuredUser; //владелец
}

export type PortfolioDto = {
  id: number;
  entryDate: Date;
  exclusionDate: Date | null;
  status: UserCommandStatus;
  team: TeamDto;
  user: SecuredUser;
}

export type CreateUpdateTaskDto = Omit<TaskDto, 'id' | 'createdAt' | 'author'>;