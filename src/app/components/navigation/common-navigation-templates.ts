import {
  M3ButtonTemplate,
  M3LabelTemplate,
  M3TemplateKind,
} from '../../../modules/m3/components/navigation/m3-navigation-types';

const common = {
  BonusToken: {
    label: {
      kind: M3TemplateKind.Label,
      text: 'bonus',
      icon: 'star',
    } as M3LabelTemplate,
  },
  more: {
    type: 'icon',
    icon: 'more_vert',
  } as M3ButtonTemplate,
};

function transform<E>(e: E, a: Partial<E>): E {
  return {
    ...e,
    ...a,
  } as E;
}

export const Navigation = {
  transform: transform,
  location: {
    HomePage: {
      kind: M3TemplateKind.Label,
      route: {
        commands: ['home'],
      },
      icon: 'home',
      text: 'Home',
    } as M3LabelTemplate,
    UserHomePage: {
      kind: M3TemplateKind.Label,
      route: {
        commands: ['user'],
      },
      icon: 'list',
      text: 'Sessions',
    } as M3LabelTemplate,
    RoomPage: {
      kind: M3TemplateKind.Label,
      icon: 'room',
      text: 'Room',
    } as M3LabelTemplate,
    Comments: {
      kind: M3TemplateKind.Label,
      icon: 'forum',
      text: 'Comments',
    } as M3LabelTemplate,
    Moderation: {
      kind: M3TemplateKind.Label,
      icon: 'gavel',
      text: 'Moderation',
    } as M3LabelTemplate,
  },
  common: {
    CreateRoom: {
      kind: M3TemplateKind.Label,
      icon: 'add',
      text: 'Create Room',
    } as M3LabelTemplate,
    BonusToken: {
      kind: M3TemplateKind.Label,
      icon: 'star',
      text: 'Bonus Token',
    } as M3LabelTemplate,
    LogOut: {
      kind: M3TemplateKind.Label,
      icon: 'logout',
      text: 'Logout',
    } as M3LabelTemplate,
  },
  feature: {
    QuestionFocus: {
      kind: M3TemplateKind.Label,
      icon: 'desktop_windows',
      text: 'Question focus',
    } as M3LabelTemplate,
    FlashPoll: {
      kind: M3TemplateKind.Label,
      icon: 'flash_on',
      text: 'Flash Poll',
    } as M3LabelTemplate,
    QuestionRadar: {
      kind: M3TemplateKind.Label,
      icon: 'radar',
      text: 'Question Radar',
    } as M3LabelTemplate,
    QuizRally: {
      kind: M3TemplateKind.Label,
      icon: 'rocket_launch',
      text: 'Quiz Rally',
    } as M3LabelTemplate,
    Brainstorming: {
      kind: M3TemplateKind.Label,
      icon: 'tips_and_updates',
      text: 'Brainstorming',
    } as M3LabelTemplate,
  },
  allButtonTemplates(
    data: M3LabelTemplate[],
    type: Partial<Exclude<M3ButtonTemplate, M3LabelTemplate>>,
  ) {
    return data.map((x) => this.asButtonTemplate(x, type));
  },
  asButtonTemplate(
    data: M3LabelTemplate,
    type: Partial<Exclude<M3ButtonTemplate, M3LabelTemplate>>,
  ): M3ButtonTemplate {
    return {
      ...data,
      ...type,
    } as M3ButtonTemplate;
  },
  more(data: M3LabelTemplate[]): M3ButtonTemplate {
    return transform(common.more, {
      triggerFor: data,
    });
  },
};
