<template>
  <div :class="$style.Host">
    <img :src="images_.icon" :class="$style.Icon" />
  </div>
</template>

<script>
import IconImage from '@/src/fido/icon.png';

export default {
  data() {
    return {
      images_: {
        icon: chrome.runtime.getURL(IconImage),
      },
    };
  },
};
</script>

<style module lang="sass">
.Host {
  background: #FFFFFF;
  height: 41px;
  overflow: hidden;
  padding: 4px 10px;
}

.Icon {
  height: 40px;
  width: 40px;
}
</style>
