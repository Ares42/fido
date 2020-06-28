<template>
  <div :class="$style.Host">
    <TopBar :class="$style.TopBar" />
    <Widgets :class="$style.Widgets" :metadata="metadata" />
  </div>
</template>

<script>
import TopBar from '@/src/fido/TopBar';
import Widgets from '@/src/fido/Widgets';

export default {
  components: { TopBar, Widgets },

  props: {
    metadata: Object,
  },
};
</script>

<style module lang="sass">
@import '@/src/sass/fonts';
@import '@/src/sass/layout';

.Host {
  @include fonts-clear;
  @include layout-vertical;

  margin-bottom: 12px;
  max-height: 80vh;
}

.TopBar {
  flex-shrink: 0;
}

.Widgets {
  flex-grow: 1;
}
</style>
