<template>
  <q-btn 
    label="Agile доска" 
    color="primary" 
    icon="dashboard"
    v-bind="$attrs"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
import type { ProjectDto } from '../../../../backend/src/common/types';

defineProps<{
  project: ProjectDto;
}>();

defineEmits(['click']);
</script>