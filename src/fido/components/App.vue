<template>
  <div :class="$style.Host">
    <TopBar :class="$style.TopBar" />
    <Widgets :class="$style.Widgets" :metadata="metadata" />
  </div>
</template>

<script>
import TopBar from '@/src/fido/components/TopBar';
import Widgets from '@/src/fido/components/Widgets';

export default {
  components: { TopBar, Widgets },

  props: {
    metadata: Object,
  },
};
</script>

<style module lang="sass">
@import '@/src/fido/sass/fonts';
@import '@/src/fido/sass/layout';

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
