import { MultiLevelData } from 'app/components/shared/_dialogs/multi-level-dialog/interface/multi-level-dialog.types';

export const DATA: MultiLevelData = {
  title: 'test-dialog.title',
  buttonSection: 'test-dialog',
  confirmKey: 'confirm',
  questions: [
    // do you like cookies?
    {
      tag: 'question-1',
      title: 'test-dialog.question-1',
      action: {
        type: 'select',
        optionLabels: [
          'test-dialog.question-1-answers.0', // yes
          'test-dialog.question-1-answers.1', // No
        ],
      },
      questions: [
        // with chocolate or raisins
        {
          tag: 'question-1-1',
          title: 'test-dialog.question-1-1',
          action: {
            type: 'select',
            optionLabels: [
              'test-dialog.question-1-1-answers.0', // chocolate
              'test-dialog.question-1-1-answers.1', // raisins
            ],
          },
          active: (answers) => answers.cachedAnswers.get('question-1') === 0,
          questions: [
            // dark or light choclolate?
            {
              tag: 'question-1-1-1',
              title: 'test-dialog.question-1-1-1',
              action: {
                type: 'select',
                optionLabels: [
                  'test-dialog.question-1-1-1-answers.0', // dark
                  'test-dialog.question-1-1-1-answers.1', // light
                ],
              },
              active: (answers) =>
                answers.cachedAnswers.get('question-1-1') === 0,
            },
            // do you like grapes?
            {
              tag: 'question-1-1-2',
              title: 'test-dialog.question-1-1-2',
              action: {
                type: 'select',
                optionLabels: [
                  'test-dialog.question-1-1-2-answers.0', // yes
                  'test-dialog.question-1-1-2-answers.1', // no
                ],
              },
              active: (answers) =>
                answers.cachedAnswers.get('question-1-1') === 1,
            },
          ],
        },
        // would you share cookies?
        {
          tag: 'question-1-2',
          title: 'test-dialog.question-1-2',
          action: {
            type: 'select',
            optionLabels: [
              'test-dialog.question-1-2-answers.0', // yes
              'test-dialog.question-1-2-answers.1', // no
            ],
          },
          active: (answers) => answers.cachedAnswers.get('question-1') === 0,
        },
      ],
    },
    // how are you team skills?
    {
      tag: 'question-2',
      title: 'test-dialog.question-2',
      action: {
        type: 'select',
        optionLabels: [
          'test-dialog.question-2-answers.0', // good
          'test-dialog.question-2-answers.1', // bad
        ],
      },
      questions: [
        // how are you leadership skills?
        {
          tag: 'question-2-1',
          title: 'test-dialog.question-2-1',
          action: {
            type: 'select',
            optionLabels: [
              'test-dialog.question-2-1-answers.0', // yes
              'test-dialog.question-2-1-answers.1', // no
            ],
          },
        },
        // how are you communication skills?
        {
          tag: 'question-2-2',
          title: 'test-dialog.question-2-2',
          action: {
            type: 'select',
            optionLabels: [
              'test-dialog.question-2-2-answers.0', // good
              'test-dialog.question-2-2-answers.1', // bad
            ],
          },
        },
      ],
    },
    // how are you programming skills?
    {
      tag: 'question-3',
      title: 'test-dialog.question-3',
      action: {
        type: 'select',
        optionLabels: [
          'test-dialog.question-3-answers.0', // good
          'test-dialog.question-3-answers.1', // bad
        ],
      },
      questions: [
        // how are you design skills?
        {
          tag: 'question-3-1',
          title: 'test-dialog.question-3-1',
          action: {
            type: 'select',
            optionLabels: [
              'test-dialog.question-3-1-answers.0', // good
              'test-dialog.question-3-1-answers.1', // bad
            ],
          },
          active: (answers) => answers.cachedAnswers.get('question-3') === 0,
        },
        // how are you database skills?
        {
          tag: 'question-3-2',
          title: 'test-dialog.question-3-2',
          action: {
            type: 'select',
            optionLabels: [
              'test-dialog.question-3-2-answers.0', // good
              'test-dialog.question-3-2-answers.1', // bad
            ],
          },
          active: (answers) => answers.cachedAnswers.get('question-3') === 0,
        },
      ],
    },
    // do you want to work here?
    {
      tag: 'question-4',
      title: 'test-dialog.question-4',
      action: {
        type: 'select',
        optionLabels: [
          'test-dialog.question-4-answers.0', // yes
          'test-dialog.question-4-answers.1', // no
        ],
      },
    },
  ],
};
