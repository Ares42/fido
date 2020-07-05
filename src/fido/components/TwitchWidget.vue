<template>
  <div :class="$style.Host">
    <div>{{ JSON.stringify(user_, null, 2) }}</div>
    <div>{{ JSON.stringify(stream_, null, 2) }}</div>
  </div>
</template>

<script>
import PatreonIcon from '@/src/fido/assets/patreon.svg';

export default {
  props: {
    url: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      user_: null,
      stream_: null,
    };
  },

  watch: {
    url: {
      immediate: true,
      handler() {
        fetch(`${process.fido.flags.server}/api/v1/twitch?url=${this.url}`)
          .then((response) => response.json())
          .then(({ user, stream }) => {
            this.user_ = user;
            this.stream_ = stream;
          })
          .catch((error) => {
            console.error(error);
          });
      },
    },
  },
};
</script>

<style module lang="sass">
@import '@/src/fido/sass/fonts';

.Host {
  @include fonts-body;

  padding: 15px;
  overflow: scroll;

  & > div {
    white-space: pre;
  }
}
</style>
