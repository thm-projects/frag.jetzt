import { signal } from '@angular/core';
import { M3NavigationTemplate } from 'modules/navigation/m3-navigation.types';

const generateTemplate = (): M3NavigationTemplate => {
  return {
    elevation: 0,
    header: {
      title: 'Test',
      options: [
        {
          icon: 'account_circle',
          title: 'Manage account',
          items: [
            {
              icon: 'grade',
              title: 'Test',
              onClick: () => console.log('test 1 clicked'),
            },
            {
              icon: 'grade',
              title: 'Test',
              onClick: () => console.log('test 2 clicked'),
            },
          ],
        },
        {
          icon: 'account_circle',
          title: 'Manage account',
          items: [
            {
              icon: 'grade',
              title: 'Test',
              onClick: () => console.log('test 1 clicked'),
            },
            {
              icon: 'grade',
              title: 'Test',
              onClick: () => console.log('test 2 clicked'),
            },
          ],
        },
        {
          icon: 'account_circle',
          title: 'Manage account',
          items: [
            {
              icon: 'grade',
              title: 'Test1',
              onClick: () => console.log('test 1 clicked'),
            },
            {
              icon: 'grade',
              title: 'Test2',
              onClick: () => console.log('test 2 clicked'),
            },
          ],
        },
      ],
    },
    navigations: [
      {
        title: 'Rooms',
        onClick: () => {
          console.log('Rooms clicked');
        },
        icon: 'meeting_room',
      },
      {
        title: 'Comments',
        onClick: () => {
          console.log('Comments clicked');
        },
        icon: 'forum',
      },
      {
        title: 'Test',
        onClick: () => {
          console.log('Test clicked');
        },
      },
      {
        title: 'Test 1',
        onClick: () => {
          console.log('Test clicked');
        },
      },
      {
        title: 'Test 3',
        onClick: () => {
          console.log('Test clicked');
        },
      },
      {
        title: 'Test 3',
        onClick: () => {
          console.log('Test clicked');
        },
      },
      {
        title: 'Test 3',
        onClick: () => {
          console.log('Test clicked');
        },
      },
      {
        title: 'Test 4',
        activated: true,
        onClick: () => {
          console.log('Test clicked');
        },
      },
    ],
    options: [
      {
        title: 'Settings',
        options: [
          {
            title: 'Settings 1',
            icon: 'settings',
            onClick: () => {
              console.log('Settings 1 clicked');
            },
          },
          {
            title: 'Settings 2',
            icon: 'settings',
            onClick: () => {
              console.log('Settings 2 clicked');
            },
          },
          {
            title: 'Settings 3',
            icon: 'settings',
            options: [
              {
                title: 'Settings 3.1',
                icon: 'settings',
                onClick: () => {
                  console.log('Settings 3.1 clicked');
                },
              },
              {
                title: 'Settings 3.2',
                icon: 'settings',
                onClick: () => {
                  console.log('Settings 3.2 clicked');
                },
              },
              {
                title: 'Settings 3.3',
                icon: 'settings',
                options: [
                  {
                    title: 'Settings 3.3.1',
                    icon: 'settings',
                    onClick: () => {
                      console.log('Settings 3.3.1 clicked');
                    },
                  },
                  {
                    title: 'Settings 3.3.2',
                    icon: 'settings',
                    onClick: () => {
                      console.log('Settings 3.3.2 clicked');
                    },
                  },
                  {
                    title: 'Settings 3.3.3',
                    icon: 'settings',
                    onClick: () => {
                      console.log('Settings 3.3.3 clicked');
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    preferedNavigation: {
      type: 'tabs',
    },
    primaryAction: {
      icon: 'add',
      onClick: () => {
        console.log('Primary action clicked');
      },
      title: 'Write Comment',
    },
  };
};

export const DEFAULT_TEMPLATE =
  signal<M3NavigationTemplate>(generateTemplate());
