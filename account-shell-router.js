(function () {
  const mount = document.getElementById("account-role-cards");
  const quick = document.getElementById("account-quick-routes");
  if (!mount && !quick) return;

  fetch("assets/data/account-shell.json")
    .then((response) => response.json())
    .then((data) => {
      if (mount) {
        mount.innerHTML = data.roles.map((role) => `
          <div class="card">
            <h3>${role.label}</h3>
            <p>${role.summary}</p>
            <p style="margin-top:12px;font-size:13px;color:#60716b;">${role.modules.join(" · ")}</p>
            <div class="cta-row">
              <a class="btn" href="${role.route}">Открыть</a>
            </div>
          </div>
        `).join("");
      }

      if (quick) {
        quick.innerHTML = data.roles.map((role) => `
          <a class="btn secondary" href="${role.route}">${role.label}</a>
        `).join("");
      }
    })
    .catch(() => {
      if (mount) {
        mount.innerHTML = `
          <div class="card">
            <h3>Роли кабинетов</h3>
            <p>Маршруты ролей временно недоступны для загрузки, но основные кабинеты остаются доступны из навигации.</p>
          </div>
        `;
      }
    });
})();
