<template>
  <view class="field">
    <text class="label">{{ label }}</text>
    <input
      class="input"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :placeholder-class="placeholderClass"
      @input="onInput"
    />
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    placeholder?: string;
    type?: string;
    placeholderClass?: string;
  }>(),
  {
    type: "text",
    placeholder: "",
    placeholderClass: "placeholder",
  }
);

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

const onInput = (event: { detail: { value: string } }) => {
  emit("update:modelValue", event.detail.value ?? "");
};
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 10rpx;

  .label {
    font-size: 24rpx;
    color: var(--ink-soft);
  }

  .input {
    width: 100%;
    height: 74rpx;
    padding: 0 20rpx;
    font-size: 26rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.95);
    border: 1rpx solid rgba(16, 60, 66, 0.14);
    box-shadow: inset 0 6rpx 14rpx rgba(16, 29, 34, 0.05);
    color: var(--ink);
    caret-color: var(--accent);
    line-height: 74rpx;

    &:focus {
      border-color: rgba(20, 184, 166, 0.4);
      box-shadow: 0 0 0 2rpx rgba(20, 184, 166, 0.12);
    }
  }

  :deep(.placeholder) {
    color: rgba(77, 91, 96, 0.6);
  }
}
</style>
