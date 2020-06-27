<template>
  <div :class="$style.Host">
    <div :class="$style.Description">
      <div ref="description" contenteditable @keyup="saveDescription_">
        Some YouTube description.
      </div>
      <button @click="loadFido_">load fido</button>
    </div>
    <div :class="$style.Fido">
      <div :class="$style.FidoWrapper">
        <Fido :metadata="metadata" />
      </div>
    </div>
  </div>
</template>

<script>
import Fido from '@/src/fido/App';

import { parseDescription } from '@/src/parser';

export default {
  components: { Fido },

  data() {
    return {
      metadata: null,
    };
  },

  methods: {
    loadFido_() {
      this.saveDescription_();
      this.metadata = parseDescription(this.$refs.description.innerText);
    },

    saveDescription_() {
      localStorage.setItem(
        'fido:dev-server:description',
        this.$refs.description.innerText
      );
    },
  },

  mounted() {
    const description = localStorage.getItem('fido:dev-server:description');
    this.$refs.description.innerText = description;
  },
};
</script>

<style module lang="sass">
@import '@/src/sass/fonts';
@import '@/src/sass/layout';

.Host {
  @include layout-fill;
  @include layout-horizontal;
}

.Description {
  @include _fonts-base;

  background: #1B1B1B;
  color: #FFFFFF;
  flex: 50%;
  font-family: Helvetica;
  font-size: 16px;
  line-height: normal;
  overflow: scroll;

  & > div[contenteditable] {
    padding: 50px;

    &:focus {
      outline: none;
    }
  }

  & > button {
    border-radius: 2px;
    border: none;
    margin: 0 50px;
    outline: none;
    padding: 10px 20px;
  }
}

.Fido {
  @include layout-center;

  flex: 50%;
}

.FidoWrapper {
  font-family: Roboto, Arial, sans-serif;
  font-size: 10px;
  line-height: normal;
  overflow: hidden;
  width: 402px;
}
</style>

<style lang="sass">
@import '@/src/sass/fonts';
@import '@/src/sass/layout';

* {
  font-size: inherit;
  margin: 0;
  padding: 0;
}

html body {
  @include fonts-clear;
}

[hidden] {
  display: none !important;
}
</style>
