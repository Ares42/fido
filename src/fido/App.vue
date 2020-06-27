<template>
  <div :class="$style.Host">{{ JSON.stringify(metadata, null, 2) }}</div>
</template>

<script>
export default {
  props: {
    metadata: Object,
  },
};
</script>

<style module lang="sass">
.Host {
  border-bottom: 1px solid #E0E0E0;
  margin-bottom: 12px;
  overflow: hidden;
  padding-bottom: 12px;
  white-space: pre;
}
</style>
