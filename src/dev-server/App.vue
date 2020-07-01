<template>
  <div :class="$style.Host">
    <div :class="$style.Description">
      <codemirror
        :class="$style.CodeMirror"
        v-model="codemirror_.code"
        :options="codemirror_.options"
        @changes="onCodeChange_"
      />
      <div :class="$style.Toolbar">
        <button @click="parseAndLoad_">parse + load</button>
      </div>
    </div>
    <div :class="$style.Fido">
      <div :class="$style.FidoWrapper">
        <Fido :metadata="metadata" />
      </div>
    </div>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css?raw';
import 'codemirror/mode/xml/xml.js';
import 'codemirror/theme/base16-dark.css?raw';

import Fido from '@/src/fido/App';

import { parseDescription } from '@/src/parser';

export default {
  components: { codemirror, Fido },

  data() {
    return {
      codemirror_: {
        code:
          localStorage['fido:dev-server:description'] ||
          '<span>description html</span>',
        options: {
          mode: 'xml',
          htmlMode: true,
          theme: 'base16-dark',
          lineNumbers: true,
          line: true,
          tabSize: 2,
        },
      },
      metadata: null,
    };
  },

  methods: {
    onCodeChange_() {
      localStorage['fido:dev-server:description'] = this.codemirror_.code;
    },

    parseAndLoad_() {
      const element = document.createElement('div');
      element.innerHTML = this.codemirror_.code;
      this.metadata = parseDescription(element);
    },
  },

  mounted() {
    this.parseAndLoad_();
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
  @include layout-vertical;

  background: #151515;
  flex-grow: 1;
}

.CodeMirror {
  flex-grow: 1;
  font-size: 16px;
  line-height: normal;

  & > div {
    height: 100%;
  }
}

.Toolbar {
  flex-shrink: 0;
  height: 50px;
  margin: 20px;
  text-align: center;

  & > button {
    @include fonts-body;

    background: #FFFFFF;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    display: inline-block;
    outline: none;
    padding: 12.5px 24px;

    &:hover {
      background: #F0F0F0;
    }

    &:active {
      background: #E0E0E0;
    }
  }
}

.Fido {
  @include layout-center;

  background: #F9F9F9;
  flex-shrink: 0;
  padding: 50px;
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
