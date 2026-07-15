# Object Digital Passport · v0.6 Alpha

> 🌐 **Language / Язык**
>
> | | Language | |
> |---|---|---|
> | 🇬🇧 | English | **You are here** |
> | 🇷🇺 | Русский | [README.ru.md](README.ru.md) |
>
> Want to add your language? Start a thread in [Discussions](https://github.com/object-digital-passport/object-digital-passport/discussions) — any localization is welcome.


Hi there! I'm **Andrei Chernikov** — a contemporary artist, entrepreneur, and archivist working on my family genealogy.

Working across three completely different fields opened up a unique paradigm for me — and that's how I arrived at this project.

---

**Object Digital Passport (ODP)** is an open-source standard for creating digital passports for objects — whether that's art, limited-edition brand products, or archival documents.

**The main goal: maximize protection against counterfeits.** Cheap, convenient, and with no dependency on any single company.

It runs on a blockchain, with minimal payment only for processing the record. This is the only approach that guarantees independence from any brand or manufacturer, while ensuring decentralization of information and maximum reliability. It also means anyone can verify information 50, 100, or 250 years from now.

⚠️ **ODP is currently in Alpha:** changes to the contract are possible, which may affect the availability of your passports and account in the future. Please wait for the stable version for long-term use. Ambitious target: launch in **January 2027**. More details at the bottom of the page.


---

> ### 🙋 Looking for contributors
>
> I work on this project entirely alone — and without a programming background. It's all vibecoding. So I'm looking for **real people** who can not only review the current state, but help correctly implement new features, assist with testing, and more.
>
> Please join the community or invite anyone who might find this project interesting. **Object Digital Passport is for people and by people.** I genuinely believe that if we build a strong community around this project, we can literally change the world — making it just a little bit better.

---


## How it works

**The entire foundation of ODP is maximum transparency among all participants.**

When you register in the ODP system, you receive a **unique ID**. It must be public and easily findable by regular people — this is not a request, it's a **system requirement**. Without it, a decentralized system cannot be built.

When you create a passport for an object, you receive its **unique number**. It must also be placed on the object itself. What exactly this should look like is still to be decided — the solution will be shaped through community interaction.

To use ODP, you need to register any **crypto wallet on the POL network** in the system. This GitHub repository includes a purpose-built example web page where you can try everything described here. But nothing stops you from reading the SPEC and building your own site or application. The project is licensed under **MIT**.

---

## Account types

| Prefix | Type | Description |
|---|---|---|
| **C** | Creator | For individual persons |
| **B** | Brand | For brands releasing products; higher passport issuance limits |
| **P** | Proof institutional | For galleries, auction houses, and institutions working directly with ODP objects |
| **M** | Museum | For museums with large collections including works by deceased artists |

Each account type has its own limits and capabilities. **Clear type labeling is one of the first verification markers.** If someone shares the ODP of a contemporary artist's work but the profile prefix is "M" — that's your first red flag 🚩

> **Important:** Object Digital Passport is not a magic wand that defeats counterfeits once and for all. It's a tool in human hands — it does not replace professional expertise. For more on the "layers" of protection ODP offers, see the specification.

---

## FAQ

### **So why should I bother?**
If you want to protect your works from potential counterfeits or create an "indestructible" catalogue of your work.

### **What information can be stored in ODP?**
There's no definitive answer yet — we're experimenting with different options across versions. Please check the page (either by downloading the relevant release from Github and opening it locally in the `web/frontend` folder, or viewing the current version online).

### **Is adding a record all I need to do?**
No. There is a companion file **`.odpass`** that conveniently stores all additional information that physically cannot go on-chain due to size limits (photo of the work, additional attributes, etc.). A hash of that information is stored, making tampering impossible.

**You must keep this file** — otherwise only minimal information will be stored on-chain.

The `.odpass` file can either be kept privately and shared on request, or uploaded to your own site with a link provided to the system — if the hash matches, it will display the file's information. Changes possible after community discussion.

### **Can I change an ODP after uploading it?**
Core fields — **no**. Only supplementary fields that don't affect authenticity can be changed: the link to the companion file, the current passport owner, etc. Please review the web page or specification for more detail.

### **What does it actually cost?**
One ODP record on the POL protocol costs **~$0.01–0.03**. Only the minimum technically necessary amount — the standard itself takes no commission.

---

There are still many details and nuances to cover. Object Digital Passport was designed with large institutions in mind, as well as future-proof considerations. Please **read the specification** — it answers all remaining questions. Or post in the discussions!

---

> # 📄 Documentation
>
> | File | Description |
> |---|---|
> | [SPEC.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md) | Full protocol specification |
> | [docs/SECURITY.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/SECURITY.md) | Threat model and security recommendations |
> | [docs/CONTRIBUTING.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/CONTRIBUTING.md) | How to contribute |
> | [docs/V0.6.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/V0.6.md) | Current line v0.6 |
> | [docs/OBJECTID\_PROFILE.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/OBJECTID_PROFILE.md) | Object ID compatibility profile (theft documentation + recovery) |
> | [Specification (rendered) →](https://object-digital-passport.github.io/object-digital-passport/spec/) | Read the spec as a web page |
> | [Live demo →](https://object-digital-passport.github.io/object-digital-passport/demo/) | Try the functionality online |
>
> **Repository layout:** [`docs/`](docs/) · [`web/frontend/`](web/frontend/) (UI) · [`web/backend/`](web/backend/) (on-chain client) · [`chain/`](chain/) (contracts)


---

> # 💬 Join the Discussion
> Head to **Discussions** and respond in **"We need your help!"** — we'll find a task where you can contribute most.
>
> Thanks for visiting and taking the time to learn about Object Digital Passport. If you want to help or know someone who might be interested — **we're waiting for you!**
