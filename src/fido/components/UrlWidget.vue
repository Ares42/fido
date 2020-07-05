<template>
  <div :class="$style.Host">
    <div :class="$style.TopBar">
      <img :class="$style.TopBar_Icon" :src="otherLinksIcon_" />
      <div :class="$style.TopBar_Label">Other Links</div>
    </div>

    <a
      :class="$style.Link"
      v-for="link of links_"
      :key="link.url"
      target="blank"
      :href="link.url"
    >
      <div :class="$style.Text">
        <div :class="$style.Label" v-if="link.label">{{ link.label }}</div>
        <div :class="$style.Url" :href="link.url" target="blank">
          {{ link.url }}
        </div>
      </div>
      <div :class="$style.Favicon">
        <img :src="link.icon" v-if="link.icon" />
        <div v-else />
      </div>
    </a>
  </div>
</template>

<script>
import OtherLinksIcon from '@/src/fido/assets/other_links.png';

export default {
  props: {
    links: {
      type: Array,
    },
  },

  data() {
    return {
      otherLinksIcon_: chrome.runtime.getURL(OtherLinksIcon),
      links_: [],
    };
  },

  watch: {
    links: {
      immediate: true,
      handler() {
        this.links_ = this.links.map(({ url, label }) => {
          const link = { url, label, icon: null };

          fetch(`${process.fido.flags.server}/api/v1/favicon?url=${url}`)
            .then((response) => response.json())
            .then(({ src }) => {
              if (!src) return;
              link.icon = src;
            })
            .catch((error) => {
              console.error(
                `Failed to load favicon for ${url} with error:`,
                error
              );
            });

          return link;
        });
      },
    },
  },
};
</script>

<style module lang="sass">
@import '@/src/fido/sass/fonts';
@import '@/src/fido/sass/layout';

.Host {
}

.TopBar {
  @include layout-horizontal;

  padding: 15px;
}

.TopBar_Icon {
  height: 25px;
  width: 25px;
}

.TopBar_Label {
  @include fonts-body;

  font-size: 18px;
  line-height: 25px;
  margin-left: 8px;
}

.Link {
  @include layout-horizontal

  color: inherit;
  cursor: pointer;
  padding: 15px;
  text-decoration: none;

  &:hover {
    background: #F9F9F9;
  }

  &:active {
    background: #F6F6F6;
  }

  & ~ .Link {
    border-top: 1px solid #E0E0E0;
  }
}

.Text {
  flex-grow: 1;
  overflow: hidden;
}

.Label {
  @include fonts-body;

  margin-bottom: 6px;
}

.Url {
  @include fonts-body;

  color: #F29434;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.Favicon {
  @include layout-center;

  flex-shrink: 0;
  margin-left: 15px;

  & > img {
    height: 20px;
    width: 20px;
  }

  & > div {
    background: #F4F4F4;
    border-radius: 2px;
    height: 20px;
    width: 20px;
  }
}
</style>
