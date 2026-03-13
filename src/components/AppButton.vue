<template>
  <button class="btn" :class="variantClass" @tap="$emit('tap')">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({
  options: { virtualHost: true },
});

const props = withDefaults(
  defineProps<{ variant?: "primary" | "ghost" | "warn"; block?: boolean }>(),
  { variant: "primary", block: true }
);

defineEmits<{ (e: "tap"): void }>();

const variantClass = computed(() => {
  const sizeClass = props.block ? "is-block" : "is-inline";
  return `is-${props.variant} ${sizeClass}`;
});
</script>

<style lang="scss" scoped>
  .btn {
    width: 100%;
    height: 74rpx;
    padding: 0 32rpx;
    font-size: 26rpx;
    border-radius: 999rpx;
    line-height: 74rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border: none;
    font-weight: 600;
    letter-spacing: 1rpx;
    transition: transform 0.15s ease;

  &.is-inline {
    width: auto;
    min-width: 0;
    flex: 1;
  }

  &.is-primary {
    background: linear-gradient(135deg, var(--accent), #2dd4bf);
    color: #ffffff;
    box-shadow: 0 12rpx 28rpx rgba(20, 184, 166, 0.28);
  }

  &.is-ghost {
    background: rgba(255, 255, 255, 0.85);
    border: 1rpx solid var(--line);
    color: var(--ink);
    box-shadow: 0 10rpx 24rpx rgba(16, 29, 34, 0.08);
  }

  &.is-warn {
    background: rgba(255, 255, 255, 0.85);
    border: 1rpx solid rgba(255, 122, 89, 0.6);
    color: #d85f44;
    box-shadow: 0 10rpx 24rpx rgba(16, 29, 34, 0.08);
  }

  &:active {
    transform: translateY(2rpx);
  }
}

button::after {
  border: none;
}
</style>
