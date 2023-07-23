<script setup></script>

<template>
  <div class="fftBar">
    <h3>You’ve successfully created a project with</h3>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.fftBar h1,
.fftBar h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .fftBar h1,
  .fftBar h3 {
    text-align: left;
  }
}
</style>
