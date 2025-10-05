# 🛡️ Veritas

AI-powered Chrome extension that detects misinformation in real time.


[![Chrome](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)

---

## 🚨 Why Veritas?

Fake news spreads **6x faster** than truth. Manual fact-checking takes **30+ minutes**.

**Veritas checks articles in 2–3 seconds** with AI to flag:

* Low-credibility sources
* Emotional manipulation & bias
* Unverified claims
* Harmful/disinformation risks

---

## ⚡ Features

* 2–3s AI-powered analysis (Cerebras + Llama 3.1)
* 80%+ accuracy with multi-stage verification
* Social harm & bias detection
* Privacy-first: no tracking, local caching
* Clean, lightweight UI

---

## 🛠️ How It Works

```
Article → Local checks (<100ms) → AI analysis (2–3s) → Risk score → Cache (1hr)
```

* **Local checks**: sensationalism, grammar, domain reputation
* **AI analysis**: claims, bias, emotional manipulation
* **Risk assessment**: violence/discrimination potential
* **Cache**: instant re-checks

---

## 🚀 Quick Start

```bash
git clone https://github.com/Vishal2002/Veritas.git
cd veritas
npm install
npm run build
```

1. Open Chrome → `chrome://extensions/`
2. Enable Dev Mode → Load unpacked → Select `dist/`
3. Add your Cerebras API key in the popup

---

## 🔑 Permissions

* `activeTab` – read article text
* `storage` – save settings & cache
* `scripting` – inject UI
* `<all_urls>` – works on any site

---

## 🌐 Links

* Website: [veritas.vercel.app](https://veritas.vercel.app)
* Hackathon: [FutureStack 2025](https://www.wemakedevs.org/hackathons/futurestack25)
* Cerebras: [cloud.cerebras.ai](https://cloud.cerebras.ai)

