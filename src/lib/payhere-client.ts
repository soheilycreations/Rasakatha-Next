// Browser-side: posts the signed form to PayHere (it only accepts a form POST).
export function submitPayHereForm(form: { action: string; fields: Record<string, string> }) {
  const el = document.createElement("form");
  el.method = "POST";
  el.action = form.action;
  for (const [name, value] of Object.entries(form.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    el.appendChild(input);
  }
  document.body.appendChild(el);
  el.submit();
}
