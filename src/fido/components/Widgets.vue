<template>
  <div :class="$style.Host" v-if="metadata">
    <template v-for="widget in metadata.widgets">
      <PatreonWidget :url="widget.url" v-if="widget.type == 'patreon'" />
      <TwitchWidget :url="widget.url" v-if="widget.type == 'twitch'" />
      <UrlWidget :links="widget.links" v-if="widget.type == 'unknown'" />
    </template>
  </div>
</template>

<script>
import PatreonWidget from '@/src/fido/components/PatreonWidget';
import TwitchWidget from '@/src/fido/components/TwitchWidget';
import UrlWidget from '@/src/fido/components/UrlWidget';

export default {
  components: { PatreonWidget, TwitchWidget, UrlWidget },

  props: {
    metadata: Object,
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
  }
}
</style>
