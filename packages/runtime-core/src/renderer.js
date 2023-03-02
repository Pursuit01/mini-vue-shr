import { ref } from "../../reactive/src/reactive";
import { effect } from "../../reactive/src/effect";

export function renderer(domString, container) {
  container.innerHTML = domString;
}
const count = ref(1);
effect(() => {
  renderer(`<h1>${count}</h1>`, document.getElementById("app"));
});
count.value++;
