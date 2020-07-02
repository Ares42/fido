<template>
  <div :class="$style.Host">
    <div :class="$style.Icon"><img :src="images_.icon" /></div>
    <div :class="$style.Progress" v-if="progress_ != null">
      <div :class="$style.Progress_Label">{{ progress_ }}% complete</div>
      <div :class="$style.Progress_Bar">
        <div :style="`width: ${progress_}%`"></div>
      </div>
    </div>
    <div :class="$style.Text" v-if="text_">{{ text_ }}</div>
    <a :href="url" target="blank" :class="$style.Button">Become a patron</a>
  </div>
</template>

<script>
import PatreonIcon from '@/src/assets/images/patreon.svg';

export default {
  props: {
    url: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      images_: {
        icon: chrome.runtime.getURL(PatreonIcon),
      },

      text_: null,
      progress_: null,
    };
  },

  watch: {
    url: {
      immediate: true,
      handler() {
        fetch(`${process.fido.flags.server}/api/v1/patreonInfo?url=${this.url}`)
          .then((response) => response.json())
          .then(({ goal }) => {
            this.text_ = goal.description;
            this.progress_ = Math.round(100 * goal.progress);
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
@import '@/src/sass/fonts';

.Host {
  padding: 15px;
}

.Icon {
  height: 23px;

  & > img {
    height: 100%;
  }
}

.Progress {
  margin: 10px 10px 15px;
}

.Progress_Label {
  @include _fonts-base;

  color: #241E12;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  margin-bottom: 6px;
}

.Progress_Bar {
  height: 8px;
  border-radius: 4px;
  background: #F5F4F2;

  & > div {
    background: #E7523B;
    height: 100%;
    width: 50%;
    border-radius: 4px;
  }
}

.Text {
  @include fonts-body;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  margin: 15px 10px;
  max-height: 32px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.Button {
  background: #E85C46;
  border-radius: 999px;
  color: #FFFFFF;
  cursor: pointer;
  display: block;
  font-size: 16px;
  line-height: normal;
  margin: 15px auto 0;
  padding: 12.5px 24px;
  text-align: center;
  text-decoration: none;
  user-select: none;
  width: 140px;

  &:hover {
    background: #E7523B;
  }

  &:active {
    background: #E54931;
  }
}
</style>
