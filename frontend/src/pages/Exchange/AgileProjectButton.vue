<!-- src/components/AgileProjectButton.vue -->
<template>
  <q-btn 
    v-if="visible"
    flat 
    label="Agile доска" 
    color="primary" 
    icon="dashboard"
    v-bind="$attrs"
    @click="$emit('click')"
    :loading="loading"
  />
</template>

<script setup lang="ts">
import type { ProjectDto } from '../../../../backend/src/common/types';

defineProps<{
  project: ProjectDto;
  visible: boolean;
  loading?: boolean;
}>();

defineEmits(['click']);
</script>