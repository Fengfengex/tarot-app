import "./ui/styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing application root");
}

app.textContent = "Ether Tarot / \u4ee5\u592a\u5854\u7f57";
