import { computedResource } from 'app/utils/computed-resource';
import {
  Assistant,
  AssistantManageService,
} from '../services/assistant-manage.service';
import { room } from 'app/room/state/room';
import { computed, inject, signal } from '@angular/core';
import { UUID } from 'app/utils/ts-utils';
import { language } from 'app/base/language/language';

// assistants - fetch

export const assistants = computedResource({
  request: () => room.value(),
  loader: () => inject(AssistantManageService).listRoomAssistants(),
});

// selectedAssistants

const selectedAssistantSignal = signal<Assistant['id']>(null);
export const selectedAssistant = computed(() => {
  const a = selectedAssistantSignal();
  return assistants.value()?.find((e) => e.assistant.id === a) || null;
});

export const selectAssistant = (id: UUID): boolean => {
  const a = assistants.value().find((e) => e.assistant.id === id);
  if (!a) {
    return false;
  }
  selectedAssistantSignal.set(id);
  return true;
};

// Sort Assistants

export const sortedAssistants = computed(() => {
  const assistant = selectedAssistant();
  const elements = assistants.value();
  if (!elements) return null;
  return [...elements].sort((a, b) => {
    if (a === assistant) return -1;
    if (b === assistant) return 1;
    return a.assistant.name.localeCompare(b.assistant.name, language(), {
      sensitivity: 'base',
    });
  });
});
