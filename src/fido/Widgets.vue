<template>
  <div :class="$style.Host">
    <template v-for="url in widgets">
      <PatreonWidget :url="url.url" v-if="url.type == 'patreon'" />
      <UrlWidget :label="url.label" :url="url.url" v-else />
    </template>
  </div>
</template>

<script>
import PatreonWidget from '@/src/fido/PatreonWidget';
import UrlWidget from '@/src/fido/UrlWidget';

export default {
  components: { PatreonWidget, UrlWidget },

  props: {
    metadata: Object,
  },

  computed: {
    widgets() {
      if (!this.metadata) return [];
      return this.metadata.urls.map((url) => ({
        type: url.url.indexOf('patreon.com') != -1 ? 'patreon' : null,
        ...url,
      }));
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
