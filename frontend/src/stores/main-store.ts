import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';
import {
  Competence,
  LoginResponseDto,
  PortfolioDto,
  ProjectDto,
  Role,
  SecuredUser,
  TeamDto,
  UserAccountStatus,
  CommentDto,
  IdeaDto,
  PrivacyTeam,
  StatusTeam,
} from '../../../backend/src/common/types';
import { useProfileStore } from './profile-store';
import { useTeamStore } from './team-store';
import { useIdeaStore } from './idea-store';

export const useMainStore = defineStore('main', () => {
  const state = reactive({
    userId: 0,
    username: 'unknown',
    firstname: 'unknown',
    lastname: 'unknown',
    roles: [] as Role[],
    userStatus: UserAccountStatus.active,
    group: 'unknown',
    telephone: 'unknown',
    competence: [] as Competence[],
    portfolio: [] as PortfolioDto[],
    team_leader: null as TeamDto | null,
    team_owner: [] as TeamDto[],
    project_initiator: [] as ProjectDto[],
    team: null as TeamDto | null,
    comment: [] as CommentDto[],
    idea_initiator: [] as IdeaDto[],
  });

  const ideaStore = useIdeaStore();
  const teamStore = useTeamStore();

  const initAppState = async (appState: LoginResponseDto & { 
    group?: string; 
    telephone?: string;
    competence?: Competence[];
  }) => {
    state.userId = appState.userId;
    state.username = appState.username;
    state.firstname = appState.firstname;
    state.lastname = appState.lastname;
    state.roles = appState.roles;
    state.group = appState.group || 'unknown';
    state.telephone = appState.telephone || 'unknown';
    state.competence = appState.competence || [];
    
    // Загружаем полные данные пользователя через profile-store
    const profileStore = useProfileStore();
    try {
      await profileStore.fetchUserProfile(appState.userId);
      
      // Синхронизируем данные с profile-store
      if (profileStore.userProfile) {
        syncWithProfileStore(profileStore.userProfile);
      }

      // Синхронизируем данные с team-store
      if (teamStore.currentTeam) {
        syncWithTeamStore();
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error);
    }
  };

  const syncWithProfileStore = (profile: SecuredUser) => {
    state.group = profile.group || state.group;
    state.telephone = profile.telephone || state.telephone;
    state.competence = profile.competence || state.competence;
    state.portfolio = profile.portfolio || state.portfolio;
    state.team_leader = profile.team_leader || state.team_leader;
    state.team_owner = profile.team_owner || state.team_owner;
    state.project_initiator = profile.project_initiator || state.project_initiator;
    state.team = profile.team || state.team;
  };

  const syncWithTeamStore = () => {
    if (teamStore.currentTeam) {
      // Проверяем, является ли пользователь лидером этой команды
      if (teamStore.currentTeam.user_leader?.id === state.userId) {
        state.team_leader = teamStore.currentTeam;
      }

      // Проверяем, является ли пользователь владельцем этой команды
      if (teamStore.currentTeam.user_owner?.id === state.userId) {
        const exists = state.team_owner.some(t => t.id === teamStore.currentTeam?.id);
        if (!exists) {
          state.team_owner.push(teamStore.currentTeam);
        }
      }

      // Проверяем, является ли пользователь участником этой команды
      if (teamStore.currentTeam.user?.some(u => u.id === state.userId)) {
        state.team = teamStore.currentTeam;
      }
    }
  };

  const getCurrentUser = (): SecuredUser => {
    return {
      id: state.userId,
      email: state.username,
      firstname: state.firstname,
      lastname: state.lastname,
      group: state.group,
      telephone: state.telephone,
      roles: state.roles,
      status: state.userStatus,
      competence: state.competence,
      portfolio: state.portfolio,
      team_leader: state.team_leader,
      team_owner: state.team_owner,
      project_initiator: state.project_initiator,
      team: state.team,
      comment: state.comment,
      idea_initiator: state.idea_initiator,

    };
  };

  const updateUserData = (data: {
    group?: string;
    telephone?: string;
    competence?: Competence[];
  }) => {
    if (data.group) state.group = data.group;
    if (data.telephone) state.telephone = data.telephone;
    if (data.competence) state.competence = data.competence;
    
    // Обновляем данные в profile-store
    const profileStore = useProfileStore();
    if (profileStore.userProfile) {
      profileStore.userProfile = {
        ...profileStore.userProfile,
        ...data
      };
    }
  };

  const isAdmin = () => state.roles.some((r) => r === Role.admin);
  const isCustomer = () => state.roles.some((r) => r === Role.customer);
  const isDirectorate = () => state.roles.some((r) => r === Role.directorate);
  const isExpert = () => state.roles.some((r) => r === Role.expert);
  const isUser = () => state.roles.some((r) => r === Role.user);

  const canCreateProject = () => {
    return isAdmin() || isCustomer() || isDirectorate();
  };

  const canDeleteProject = (project?: ProjectDto) => {
    if (!project) return false;
    if (isAdmin() || isDirectorate()) return true;
    if (isCustomer() && project.initiator.id === state.userId) return true;
    return false;
  };

  const canCreateTeam = () => {
    return isAdmin() || isDirectorate();
  };

  const canJoinTeam = (team?: TeamDto) => {
    if (!isUser()) return false; // Только для роли user
    if (userHasTeam()) return false; // Уже есть команда
    if (!team) return false; // Нет данных о команде
    
    return (
      team.privacy === PrivacyTeam.open && // Только открытые команды
      team.status !== StatusTeam.delete && // Не на удалении
      !team.user.some(u => u.id === state.userId) // Уже не состоит в команде
    );
  };

  const userHasTeam = () => {
    return state.team !== null;
  };

  const canEditTeam = (team: TeamDto) => {
    return isAdmin() || team.user_owner.id === state.userId || (team.user_leader?.id === state.userId && team.user_leader !== null);;
  };

  const canDeleteTeam = (team: TeamDto) => {
    return isAdmin() || team.user_owner.id === state.userId;
  };

  const canLeaveTeam = (team: TeamDto) => {
    return team.user_leader?.id === state.userId && 
           team.user.length > 1 && // Не может покинуть, если он последний
           team.user_owner.id !== state.userId; // Владелец не может "покинуть" таким образом
  };

  // Метод для обновления данных команды из team-store
  const updateTeamData = async (teamId: number) => {
    try {
      await teamStore.fetchTeam(teamId);
      syncWithTeamStore();
    } catch (error) {
      console.error('Ошибка при обновлении данных команды:', error);
    }
  };

  const updateIdeasData = async () => {
    try {
      await ideaStore.fetchIdeas();
      state.idea_initiator = ideaStore.ideas.filter(idea => idea.initiator.id === state.userId);
    } catch (error) {
      console.error('Ошибка при обновлении данных идей:', error);
    }
  };

  return {
    ...toRefs(state),
    initAppState,
    isAdmin,
    isCustomer,
    isDirectorate,
    isExpert,
    isUser,
    canCreateProject,
    canCreateTeam,
    canJoinTeam,
    getCurrentUser,
    updateUserData,
    canEditTeam,
    canDeleteTeam,
    canDeleteProject,
    updateTeamData, 
    canLeaveTeam,
    userHasTeam,
    updateIdeasData,
  };
});