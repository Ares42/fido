<template>
  <div :class="$style.Host">
    <div>{{ label }}</div>
    <div>{{ url }}</div>
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
};
</script>

<style module lang="sass">
@import '@/src/sass/fonts';

.Host {
  & > div {
    @include fonts-body;
  }
}
</style>
