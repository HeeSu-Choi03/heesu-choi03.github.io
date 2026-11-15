// data.js의 DATA를 화면에 그린다. 내용은 직접 작성한 데이터라 별도 이스케이프를 하지 않는다.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const short = (url) => url.replace(/^https?:\/\//, "");

const solveHtml = (s) => `
  <div class="solve">
    <h4>${s.title}</h4>
    <dl class="solve-body">
      <dt>문제</dt><dd>${s.problem}</dd>
      <dt>해결</dt><dd>${s.action}</dd>
      ${s.result ? `<dt>결과</dt><dd>${s.result}</dd>` : ""}
    </dl>
  </div>`;

const ADR_PRINT_ROWS = 4; // PDF에는 앞의 4행만 (style.css의 인쇄 규칙과 짝)
const adrHtml = (rows) => !rows.length ? "" : `
  <h4 class="sub">기술 선택 기록</h4>
  <table class="adr">
    <thead><tr><th>결정</th><th>선택</th><th>이유</th><th>감수한 것</th></tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>
  ${rows.length > ADR_PRINT_ROWS ? `<p class="print-only note">외 ${rows.length - ADR_PRINT_ROWS}건은 웹에서 볼 수 있습니다.</p>` : ""}`;

const projectHtml = (p) => `
  <article class="project" id="${p.id}" data-field="${p.field}">
    <label class="pick"><input type="checkbox" checked> PDF에 포함</label>
    <header>
      <h3>${p.name}</h3>
      <p class="meta">${p.period} · ${p.context}</p>
    </header>
    <p class="tagline">${p.tagline}</p>
    <p class="role"><b>맡은 일</b> ${p.role}</p>
    <ul class="chips">${p.stack.map((s) => `<li>${s}</li>`).join("")}</ul>
    <div class="results"><b>결과</b>${list(p.results)}</div>
    <div class="solved">
      <h4 class="sub">문제 해결</h4>
      ${p.solved.map(solveHtml).join("")}
    </div>
    <details class="more">
      <summary>구현 내용 · 기술 선택 더 보기</summary>
      ${p.image ? `<img class="shot" src="${p.image}" alt="${p.imageAlt}" loading="lazy">` : ""}
      <h4 class="sub">구현 내용</h4>
      ${list(p.more.features)}
      ${adrHtml(p.more.adr)}
      ${p.more.solved.length ? `<h4 class="sub">그 밖의 문제 해결</h4>${p.more.solved.map(solveHtml).join("")}` : ""}
      <h4 class="sub">배운 점</h4>
      <p>${p.more.learned}</p>
    </details>
    <footer>
      <a href="${p.repo}">${short(p.repo)}</a>
      <button type="button" class="toggle">자세히 보기</button>
    </footer>
  </article>`;

function render() {
  const pr = DATA.profile;
  $("#about").innerHTML = `
    <div>
      <p class="eyebrow">${pr.name} · ${pr.role}</p>
      <h1>${pr.tagline}</h1>
      <p class="intro">${pr.intro}</p>
      <p class="contact">
        <a href="${pr.github}">${short(pr.github)}</a>
        <a href="mailto:${pr.email}">${pr.email}</a>
        <span id="phone-print" class="print-only"></span>
      </p>
      <ul class="facts">${pr.facts.map((f) => `<li>${f}</li>`).join("")}</ul>
    </div>
    <img class="photo" src="${pr.photo}" alt="${pr.name} 사진">`;

  $("#project-list").innerHTML = DATA.projects.map(projectHtml).join("");

  $("#papers").innerHTML = `<h2>논문</h2>${DATA.papers.map((p) => `
    <article class="paper">
      <p class="meta">${p.venue}</p>
      <h3>${p.title}</h3>
      <p class="tagline">${p.summary}</p>
      <dl class="solve-body">${p.points.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      <p class="meta">${p.authors}</p>
    </article>`).join("")}`;

  $("#awards").innerHTML = `<h2>수상 · 대회</h2><ul class="awards">${DATA.awards.map((a) => `
    <li><span class="meta">${a.date}</span><b>${a.title}</b>
      <span class="meta">${a.by}${a.link ? ` · <a href="${a.link}">프로젝트 보기</a>` : ""}</span></li>`).join("")}</ul>`;

  $("#resume").innerHTML = `<h2>이력</h2><div class="resume-grid">${Object.entries(DATA.resume).map(([title, rows]) => `
    <div><h3>${title}</h3><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div>`).join("")}</div>`;
}

function press(group, btn) {
  $$("button", group).forEach((b) => b.setAttribute("aria-pressed", b === btn));
}

function setFilter(field) {
  $$(".project").forEach((a) => (a.hidden = !!field && a.dataset.field !== field));
  press($("#filter"), $(`#filter [data-filter="${field}"]`));
}

function bind() {
  $("#view").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    document.body.classList.toggle("cards", btn.dataset.view === "cards");
    press($("#view"), btn);
  });

  $("#filter").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) setFilter(btn.dataset.filter);
  });

  // 카드 보기에서 한 프로젝트를 펼치고 접기
  $("#project-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle");
    if (!btn) return;
    const card = btn.closest(".project");
    const open = card.classList.toggle("open");
    $(".more", card).open = open; // 펼친 카드는 상세까지 한 번에
    btn.textContent = open ? "접기" : "자세히 보기";
  });

  // PDF 내보내기 모드: 이때만 체크박스가 보인다
  const bar = $("#export-bar");
  const count = () => {
    const picks = $$(".pick input");
    $("#export-count").textContent = `${picks.filter((c) => c.checked).length} / ${picks.length}개 선택`;
    picks.forEach((c) => c.closest(".project").classList.toggle("skip", !c.checked));
  };
  const exporting = (on) => {
    if (on) setFilter(""); // 선택은 전체 목록에서 한다
    document.body.classList.toggle("exporting", on);
    bar.hidden = !on;
    count();
  };
  $("#export-btn").addEventListener("click", () => exporting(true));
  $("#export-cancel").addEventListener("click", () => exporting(false));
  $("#project-list").addEventListener("change", count);

  bar.addEventListener("submit", (e) => {
    e.preventDefault();
    const full = bar.elements.depth.value === "full";
    document.body.classList.toggle("print-full", full);
    $("#phone-print").textContent = $("#phone").value.trim();
    const opened = full ? $$("details.more:not([open])") : [];
    opened.forEach((d) => (d.open = true));
    addEventListener("afterprint", () => {
      opened.forEach((d) => (d.open = false));
      document.body.classList.remove("print-full");
      $("#phone-print").textContent = "";
      exporting(false);
    }, { once: true });
    print();
  });
}

render();
bind();
