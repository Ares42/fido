<template>
  <div :class="$style.Host">
    <template v-for="url in widgets">
      <UrlWidget :label="url.label" :url="url.url" />
    </template>
  </div>
</template>

<script>
import UrlWidget from '@/src/fido/UrlWidget';

export default {
  components: { UrlWidget },

  props: {
    metadata: Object,
  },

  computed: {
    widgets() {
      if (!this.metadata) return [];
      return this.metadata.urls;
    },
  },
};
</script>

<style module lang="sass">
.Host {
  background: #FFF1E3;
  overflow-x: hidden;
  overflow-y: scroll;

  & > * {
    background: #FFFFFF;
    border-radius: 6px;
    margin: 16px;
    overflow: hidden;
    padding: 11px;
  }
}
</style>
