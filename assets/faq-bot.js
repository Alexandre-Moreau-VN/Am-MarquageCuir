/**
 * Assistant Virtuel - AM Marquage Cuir
 * Auteur: Antigravity AI
 * Description: Chatbot interactif pour répondre aux questions fréquentes.
 * Supporte le français et l'anglais en fonction de la langue de la page.
 */

(function () {
  // 1. Détection de la langue de la page
  const isEnglish = window.location.pathname.includes('-en.html') || document.documentElement.lang === 'en';

  // 2. Base de données FAQ
  const db = {
    fr: {
      welcome: "Bonjour ! Je suis l'assistant d'AM Marquage. Je peux répondre à vos questions sur nos outils, délais de livraison, tarifs et commandes. Choisissez un sujet ou posez-moi votre question !",
      fallback: "Désolé, je n'ai pas trouvé de réponse exacte à votre question. Posez-la d'une autre manière, ou contactez directement Alexandre Moreau :\n\n📧 **E-mail** : [contact@am-leathercraft.com](mailto:contact@am-leathercraft.com)\n📞 **Téléphone** : [07 80 00 88 55](tel:+33780008855)\n\nVous pouvez également nous envoyer vos fichiers via le [formulaire de contact](/pages/contact.html).",
      faq: [
        {
          id: "order",
          title: "Comment commander un outil personnalisé ?",
          keywords: ["commander", "commande", "acheter", "devis", "etape", "procedure", "perso", "personnalise", "faire", "projet", "visuel"],
          response: "Pour commander vos outils de marquage sur-mesure :\n\n1️⃣ **Partagez votre visuel** : Envoyez-nous votre logo ou illustration par e-mail ou via le formulaire (format vectoriel recommandé : AI, SVG, CDR, PDF, ou image JPG/PNG haute résolution).\n2️⃣ **Indiquez la taille** souhaitée (largeur ou hauteur en mm).\n3️⃣ **Analyse & Proposition (sous 24h)** : Nous étudions la faisabilité, créons un rendu digital/maquette et vous proposons un devis détaillé.\n4️⃣ **Validation** : Après votre accord sur la maquette et le règlement, nous lançons la fabrication.\n\n📧 Contact direct : [contact@am-leathercraft.com](mailto:contact@am-leathercraft.com)\n📄 Formulaire : [Cliquez ici pour commander](/pages/contact.html)"
        },
        {
          id: "delivery",
          title: "Quels sont les délais de fabrication et de livraison ?",
          keywords: ["delai", "livraison", "envoi", "expedition", "dhl", "reception", "recu", "temps", "suivi", "belgique", "suisse", "transport"],
          response: "Voici nos délais moyens de fabrication et de livraison :\n\n• 🟨 **Tampons laiton, acrylique, emporte-pièces & alphabets** :\n  - *Fabrication* : 2 à 4 jours ouvrés.\n  - *Livraison économique suivie* : environ 15 jours.\n  - *Livraison Express DHL* : 2 à 3 jours ouvrés.\n• ⬜ **Moules cuir & blocs de montage** :\n  - *Fabrication* : 2 à 3 jours (fabriqués en France).\n  - *Livraison* : 2 à 3 jours en France métropolitaine.\n• ⚙️ **Machine à marquer à chaud** :\n  - *Livraison* : 17 à 20 jours ouvrés (France, Belgique, Suisse).\n• 🛠️ **Autres machines (presse de coupe, refendeuse, abat-carreuse)** :\n  - *Livraison* : 8 à 15 jours.\n• 🦌 **Plioirs en corne** :\n  - *Livraison* : 3 à 4 jours ouvrés."
        },
        {
          id: "files",
          title: "Quels formats de fichiers acceptez-vous ?",
          keywords: ["format", "fichier", "extension", "vectoriel", "vectorise", "ai", "svg", "pdf", "png", "jpg", "jpeg", "cdr", "eps", "pixel", "logo", "visuel", "image"],
          response: "Pour garantir une gravure nette et fidèle :\n\n• **Formats vectoriels recommandés** : `.ai`, `.svg`, `.cdr`, `.pdf`.\n• **Formats d'image acceptés** : `.png` ou `.jpg` en haute résolution (noir et blanc pur de préférence, sans dégradés ni gris).\n\n*🎨 Si vous n'avez pas de fichier propre, nous pouvons créer ou retoucher votre logo. Parlez-en lors de votre demande !*"
        },
        {
          id: "prices",
          title: "Quels sont les tarifs de vos outils sur-mesure ?",
          keywords: ["tarif", "prix", "cout", "combien", "grille", "cher", "payer", "argent", "euro", "laiton", "acrylique", "caoutchouc", "tampon", "devis"],
          response: "Nos tarifs dépendent du matériau, de la taille et de l\u2019origine de fabrication :\n\n• 🟨 **Matoir laiton** — deux origines possibles :\n  - 🇻🇳 **Vietnam** (environ 3 semaines au total) : **49 €** jusqu\u2019à 6,5 cm², puis **+10 €** par palier de 6,5 cm²\n  - 🇫🇷 **France** (5 à 7 jours ouvrés au total) : **69 €** jusqu\u2019à 6,5 cm² (prix Vietnam + 20 €), puis **+10 €** par palier de 6,5 cm²\n  - *Option manche vissable* : **+10 €**\n\n• ⬜ **Tampon acrylique** (fabriqué en France) : **30 €** (5 mm) / **35 €** (10 mm) jusqu\u2019à 6,5 cm², puis **+5 €** par palier\n\n• 🔴 **Tampon caoutchouc** (fabriqué en France) : **30 €** jusqu\u2019à 6,5 cm², puis **+5 €** par palier\n\n*Le calculateur en haut de chaque page produit donne le prix exact selon vos dimensions. Prix TTC pour la fabrication française ; hors taxes et hors frais de douane pour le Vietnam.*"
        },
        {
          id: "materials",
          title: "Laiton vs Acrylique : comment choisir le bon tampon ?",
          keywords: ["laiton", "acrylique", "matiere", "materiau", "difference", "tampon", "matoir", "cuir", "tannage", "vegetal", "chaud", "froid", "fer", "marquer", "presse"],
          response: "Le choix dépend de votre usage et de votre budget :\n\n• 🟨 **Matoir Laiton (Pro)** :\n  - *Usage* : À froid (cuir tannage végétal humide) ou à chaud (tous cuirs, bois, carton, pain, etc.).\n  - *Avantages* : Indestructible, gravure très profonde, compatible avec fers à marquer et presses thermiques.\n• ⬜ **Tampon Acrylique (Éco)** :\n  - *Usage* : **À froid uniquement** sur cuir tannage végétal humide.\n  - *Méthode* : Utiliser exclusivement avec une presse (arbor press) ou un serre-joint.\n  - *Attention* : Ne jamais chauffer, et ne jamais frapper dessus avec un marteau au risque de le briser."
        },
        {
          id: "garantie",
          boost: ["garantie", "remboursement", "conformite", "defaut", "retour"],
          title: "Et si l'outil ne correspond pas à ce que j'attendais ?",
          keywords: ["garantie", "retour", "remboursement", "rembourse", "conformite", "conforme", "defaut", "abime", "casse", "erreur", "difference", "litige", "reclamation", "sav", "bat", "bon a tirer", "maquette"],
          response: "Avant toute fabrication, vous recevez un **devis accompagné d'un bon à tirer (BAT)** : visuel, dimensions, matière. C'est ce document qui fait foi.\n\n• **Écart entre le BAT validé et l'outil livré** : c'est ma responsabilité. Je refabrique l'outil à mes frais, ou je vous rembourse.\n• **Outil conforme au BAT validé** : aucun remboursement n'est possible. Les dimensions et le visuel ont été validés avant fabrication, et la matière, la main-d'œuvre et l'expédition ont été engagées.\n\nLes produits personnalisés ne bénéficient pas du droit de rétractation de 14 jours (art. L221-28 du Code de la consommation). Les garanties légales de conformité et des vices cachés restent applicables.\n\nUn doute sur votre fichier ou vos dimensions ? Parlons-en **avant** de valider le BAT."
        },
        {
          id: "douane",
          boost: ["douane", "douanes", "tva", "importation", "dedouanement"],
          title: "Y a-t-il des frais de douane ou des taxes ?",
          keywords: ["douane", "douanes", "taxe", "taxes", "tva", "importation", "frais", "dedouanement", "transporteur", "hors taxes"],
          response: "Cela dépend de l'origine choisie dans le calculateur :\n\n• 🇫🇷 **Fabrication en France** : prix TTC, frais de port inclus, **aucun frais de douane**.\n• 🇻🇳 **Fabrication au Vietnam** : prix **hors taxes**. Pour une livraison dans l'Union européenne, d'éventuels droits de douane et taxes à l'importation peuvent être demandés par le transporteur **à la réception du colis**.\n\nL'envoi express via DHL est possible en supplément (2 à 3 jours ouvrés).\n\nPour éviter toute surprise, la fabrication française est la solution la plus simple si vous êtes dans l'UE."
        },
        {
          id: "plaques-prix",
          title: "Combien coûte une plaque gravée ?",
          boost: ["plaque", "plaques"],
          keywords: ["plaque", "boite aux lettres", "enseigne", "prix", "tarif"],
          response: "Le prix d'une plaque dépend de sa **surface**, de l'**épaisseur** (2 ou 3 mm) et de la **finition**.\n\nLe calcul est automatique : indiquez vos dimensions en millimètres dans le calculateur de la page [Plaques gravées](/pages/plaques-laiton.html).\n\n• **À partir de 8 €** pour une petite plaque en 2 mm (10 € en 3 mm)\n• Le prix augmente par paliers de 6,5 cm²\n• **−10 % dès 10 plaques**, −20 % au-delà de 30\n• Frais de port inclus en France métropolitaine\n\nDimensions : de 5 × 5 mm à 250 × 250 mm."
        },
        {
          id: "plaques-finitions",
          title: "Quelles finitions, quelles options pour une plaque ?",
          boost: ["plaque", "plaques"],
          keywords: ["finition", "finition plaque", "poli", "brosse", "antique", "brass", "trous", "chanfrein", "epaisseur", "forme sur mesure"],
          response: "**Trois finitions** : brossé (standard, inclus), poli (brillant, effet miroir) et antique brass (aspect vieilli). Les deux dernières ajoutent +1 € par palier.\n\n**Deux épaisseurs** : 3 mm (standard) ou 2 mm.\n\n**Options incluses, sans supplément** : trous de fixation et chanfrein. Leur nombre et leur position se définissent ensemble lors du devis.\n\n**Formes** : toutes les formes sont réalisées sur mesure — rectangulaire, angles chanfreinés, découpe libre. Pour une forme particulière, indiquez-le dans votre message."
        },
        {
          id: "plaques-commande",
          title: "Comment commander une plaque et en combien de temps ?",
          boost: ["plaque", "plaques"],
          keywords: ["delai", "delai plaque", "commander une plaque", "comment commander", "bon a tirer", "bat", "fichier", "degressif", "quantite"],
          response: "**Comment commander :**\n\n1. Indiquez vos dimensions dans le [calculateur](/pages/plaques-laiton.html) : le prix s'affiche immédiatement.\n2. Envoyez-nous votre texte ou votre fichier (AI, SVG, PDF, CDR, ou JPG/PNG haute résolution).\n3. Vous recevez **sous 24 h un bon à tirer et un devis**.\n4. La fabrication démarre après votre validation du BAT.\n\n**Délais** : 2 à 4 jours ouvrés de fabrication, soit 5 à 7 jours ouvrés au total. Pour une série importante, le délai est ajusté selon notre planning.\n\nLes plaques sont **fabriquées en France**."
        },
        {
          id: "contact",
          title: "Comment vous contacter ou obtenir un devis ?",
          keywords: ["contact", "contacter", "telephone", "mail", "email", "adresse", "coordonnees", "alexandre", "moreau", "boutique", "atelier", "tel"],
          response: "Vous pouvez nous joindre directement de 9h à 18h :\n\n📞 **Téléphone** : [07 80 00 88 55](tel:+33780008855)\n📧 **E-mail** : [contact@am-leathercraft.com](mailto:contact@am-leathercraft.com)\n📄 **Formulaire de contact** : [Accéder au formulaire](/pages/contact.html)\n\n📍 *Adresse postale* : Alexandre Moreau, 16 av. Maréchal de Lattre de Tassigny, 33660 Saint-Seurin-sur-l’Isle, France."
        }
      ]
    },
    en: {
      welcome: "Hello! I am the AM Marquage assistant. I can answer your questions about our tools, delivery times, pricing, and ordering. Select a topic below or ask me a question!",
      fallback: "Sorry, I couldn't find an exact answer to your question. Please rephrase your question, or contact Alexandre Moreau directly:\n\n📧 **Email**: [contact@am-leathercraft.com](mailto:contact@am-leathercraft.com)\n📞 **Phone**: [+33 7 80 00 88 55](tel:+33780008855)\n\nYou can also submit files directly using our [contact form](/pages/contact-en.html).",
      faq: [
        {
          id: "order",
          title: "How to order a custom tool?",
          keywords: ["order", "buy", "quote", "step", "procedure", "custom", "mockup", "visual", "design", "logo", "request", "how"],
          response: "To order your custom branding tools:\n\n1️⃣ **Share your design** : Send your logo or visual by email or via our form (preferred vector format: AI, SVG, CDR, PDF, or high-res JPG/PNG image).\n2️⃣ **Provide dimensions** : Specify at least one dimension (width or height in mm).\n3️⃣ **Analysis & Quote (within 24h)** : We check the project feasibility, create a digital mockup, and send a detailed quote.\n4️⃣ **Validation** : Once you approve the mockup and complete payment, we start production immediately.\n\n📧 Direct Email: [contact@am-leathercraft.com](mailto:contact@am-leathercraft.com)\n📄 Contact Form: [Click here to order](/pages/contact-en.html)"
        },
        {
          id: "delivery",
          title: "What are the production and delivery times?",
          keywords: ["delivery", "shipping", "time", "dhl", "receive", "delay", "track", "belgium", "switzerland", "uk", "usa", "europe", "production"],
          response: "Here are our average fabrication and shipping times:\n\n• 🟨 **Brass & acrylic stamps, cutting tools & alphabets** :\n  - *Fabrication* : 2 to 4 business days.\n  - *Standard tracked shipping* : approx. 15 days.\n  - *Express DHL shipping* : 2 to 3 business days.\n• ⬜ **Leather molds** :\n  - *Fabrication* : 2 to 3 days (Made in France).\n  - *Shipping* : 2 to 3 days (France).\n• ⚙️ **Hot stamping press** :\n  - *Shipping* : 17 to 20 business days (France, Belgium, Switzerland).\n• 🛠️ **Other machines (cutting press, manual splitter, edge beveler)** :\n  - *Shipping* : 8 to 15 days.\n• 🦌 **Horn folders** :\n  - *Shipping* : 3 to 4 business days."
        },
        {
          id: "files",
          title: "What file formats do you accept?",
          keywords: ["format", "file", "extension", "vector", "vectorized", "ai", "svg", "pdf", "png", "jpg", "jpeg", "cdr", "eps", "pixel", "logo", "image", "resolution"],
          response: "To ensure a perfectly detailed engraving:\n\n• **Recommended vector formats** : `.ai`, `.svg`, `.cdr`, `.pdf`.\n• **Accepted image formats** : `.png` or `.jpg` in high resolution (preferably pure black and white, no gradients or gray shades).\n\n*🎨 If you don't have a vector design, we offer a logo touch-up or creation service. Mention it in your query!*"
        },
        {
          id: "prices",
          title: "What are the prices of custom tools?",
          keywords: ["price", "cost", "how much", "rate", "grid", "expensive", "pay", "money", "euro", "brass", "acrylic", "rubber", "stamp", "quote"],
          response: "Our rates depend on the material, size and production origin:\n\n• 🟨 **Brass stamp** — two origins available:\n  - 🇻🇳 **Vietnam** (approx. 3 weeks in total): **49 €** up to 6.5 cm², then **+10 €** per 6.5 cm² tier\n  - 🇫🇷 **France** (5 to 7 business days in total): **69 €** up to 6.5 cm² (Vietnam price + 20 €), then **+10 €** per tier\n  - *Optional screw-on handle*: **+10 €**\n\n• ⬜ **Acrylic stamp** (made in France): **30 €** (5 mm) / **35 €** (10 mm) up to 6.5 cm², then **+5 €** per tier\n\n• 🔴 **Rubber stamp** (made in France): **30 €** up to 6.5 cm², then **+5 €** per tier\n\n*The calculator at the top of each product page gives the exact price for your dimensions. Prices include VAT for French production; Vietnam prices exclude tax and customs fees.*"
        },
        {
          id: "materials",
          title: "Brass vs Acrylic: how to choose?",
          keywords: ["brass", "acrylic", "material", "difference", "stamp", "engraving", "leather", "tanning", "veg-tan", "hot", "cold", "iron", "mark", "press"],
          response: "It depends on your application and budget:\n\n• 🟨 **Brass Stamp (Pro)**:\n  - *Usage* : Cold stamping (damp veg-tan leather) or hot embossing (all leathers, wood, paper, bread, etc.).\n  - *Advantages* : Indestructible, deep engraving, compatible with branding irons and heat presses.\n• ⬜ **Acrylic Stamp (Eco)**:\n  - *Usage* : **Cold stamping only** on damp veg-tan leather.\n  - *Method* : Always use with a clamp or arbor press.\n  - *Warning* : Never heat, and never strike with a hammer, as it will break the acrylic."
        },
        {
          id: "warranty",
          boost: ["warranty", "guarantee", "refund", "defect", "return"],
          title: "What if the tool doesn't match what I expected?",
          keywords: ["warranty", "guarantee", "return", "refund", "conformity", "defect", "damaged", "broken", "mistake", "difference", "dispute", "claim", "approval", "mockup", "proof"],
          response: "Before any production, you receive a **quote with a proof to approve**: artwork, dimensions, material. That approved proof is the reference.\n\n• **Difference between the approved proof and the delivered tool**: that is my responsibility. I remake the tool at my cost, or refund you.\n• **Tool matching the approved proof**: no refund is possible. Dimensions and artwork were approved before production, and material, labour and shipping were committed.\n\nCustom-made products are excluded from the 14-day withdrawal right (art. L221-28 French Consumer Code). Legal conformity and hidden-defect guarantees still apply.\n\nUnsure about your file or dimensions? Let's talk **before** approving the proof."
        },
        {
          id: "customs",
          boost: ["customs", "duty", "duties", "vat", "import"],
          title: "Are there customs fees or taxes?",
          keywords: ["customs", "duty", "duties", "tax", "taxes", "vat", "import", "fees", "carrier", "exempt"],
          response: "It depends on the origin selected in the calculator:\n\n• 🇫🇷 **Made in France**: VAT and shipping included, **no customs fees**.\n• 🇻🇳 **Made in Vietnam**: prices **exclude tax**. For delivery in the European Union, customs duties and import taxes may be requested by the carrier **on delivery**.\n\nExpress DHL shipping is available at extra cost (2–3 business days).\n\nIf you are in the EU, French production is the simplest option."
        },
        {
          id: "plates-price",
          title: "How much does an engraved plate cost?",
          boost: ["plate", "plates"],
          keywords: ["plate", "door plate", "letterbox", "price", "quote"],
          response: "The price of a plate depends on its **surface area**, its **thickness** (2 or 3 mm) and the **finish**.\n\nThe calculator does the maths: enter your dimensions in millimetres on the [Engraved plates](/pages/plaques-laiton.html) page.\n\n• **From €8** for a small 2 mm plate (€10 in 3 mm)\n• The price rises in steps of 6.5 cm²\n• **−10 % from 10 plates**, −20 % above 30\n• Shipping included within mainland France\n\nSizes: from 5 × 5 mm to 250 × 250 mm."
        },
        {
          id: "plates-finish",
          title: "Which finishes and options are available?",
          boost: ["plate", "plates"],
          keywords: ["finish", "polished", "brushed", "antique", "holes", "chamfer", "thickness", "shape"],
          response: "**Three finishes**: brushed (standard, included), polished (mirror-like) and antique brass (aged patina). The last two add +1 € per price step.\n\n**Two thicknesses**: 3 mm (standard) or 2 mm.\n\n**Included at no extra cost**: fixing holes and chamfer. Their number and position are agreed together at the quote stage.\n\n**Shapes**: every shape is made to measure — rectangular, chamfered corners, free form. Just tell us in your message."
        },
        {
          id: "plates-order",
          title: "How do I order a plate and how long does it take?",
          boost: ["plate", "plates"],
          keywords: ["lead time", "how to order", "order a plate", "proof", "approval", "file", "discount", "quantity"],
          response: "**How to order:**\n\n1. Enter your dimensions in the [calculator](/pages/plaques-laiton.html).\n2. Send us your text or file (AI, SVG, PDF, CDR, or high-resolution JPG/PNG).\n3. You receive **a proof and a quote within 24 hours**.\n4. Production starts once you approve the proof.\n\n**Lead times**: 2 to 4 working days of production, 5 to 7 working days in total. Larger runs are scheduled according to our production plan.\n\nAll plates are **made in France**."
        },
        {
          id: "contact",
          title: "How to contact us?",
          keywords: ["contact", "phone", "email", "address", "details", "alexandre", "moreau", "shop", "studio", "tel", "location"],
          response: "You can reach us Monday to Friday (9am to 6pm):\n\n📞 **Phone** : [+33 7 80 00 88 55](tel:+33780008855)\n📧 **Email** : [contact@am-leathercraft.com](mailto:contact@am-leathercraft.com)\n📄 **Contact Form** : [Access Form](/pages/contact-en.html)\n\n📍 *Mailing address* : Alexandre Moreau, 16 av. Maréchal de Lattre de Tassigny, 33660 Saint-Seurin-sur-l’Isle, France."
        }
      ]
    }
  };

  const currentDb = isEnglish ? db.en : db.fr;

  // 3. Injection du code CSS
  const css = `
    #chatbot-container {
      position: fixed;
      bottom: 25px;
      right: 25px;
      z-index: 999999;
      font-family: 'Manrope', sans-serif;
    }

    #chatbot-toggle-btn {
      width: 56px;
      height: 56px;
      /* Neutralise les regles globales "button" de machines.css / product.css
         (padding + width:50%), qui ecrasaient la taille de l'icone. */
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #EE672F, #F89C66);
      box-shadow: 0 4px 16px rgba(238, 103, 47, 0.4);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    #chatbot-toggle-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 6px 20px rgba(238, 103, 47, 0.5);
    }

    #chatbot-toggle-btn:active {
      transform: scale(0.95);
    }

    #chatbot-toggle-btn svg {
      width: 26px;
      height: 26px;
      fill: white;
      transition: transform 0.3s ease;
    }

    #chatbot-toggle-btn.open svg.chat-icon {
      display: none;
    }

    #chatbot-toggle-btn.open svg.close-icon {
      display: block;
    }

    #chatbot-toggle-btn svg.close-icon {
      display: none;
    }

    /* Notification badge on the FAB */
    #chatbot-toggle-btn::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #2ecc71;
      border: 2px solid white;
      animation: chatbot-pulse 2s infinite;
    }

    #chatbot-toggle-btn.open::after {
      display: none;
    }

    @keyframes chatbot-pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(46, 204, 113, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
    }

    /* Chat Window Container */
    #chatbot-window {
      width: 380px;
      height: 520px;
      max-height: calc(100vh - 120px);
      position: absolute;
      bottom: 75px;
      right: 0;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(64, 90, 82, 0.15);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.95);
      transform-origin: bottom right;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15);
    }

    #chatbot-window.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    /* Header */
    #chatbot-header {
      background: #405a52; /* pine green color */
      color: white;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      border-bottom: 3px solid #EE672F; /* orange brand accent */
    }

    #chatbot-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .chatbot-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .chatbot-avatar svg {
      width: 18px;
      height: 18px;
      fill: white;
    }

    #chatbot-header-text h4 {
      margin: 0;
      font-size: 14.5px;
      font-weight: 700;
      color: white;
    }

    .chatbot-status {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
    }

    .chatbot-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #2ecc71;
      display: inline-block;
      box-shadow: 0 0 6px #2ecc71;
      animation: chatbot-pulse-green 1.5s infinite;
    }

    @keyframes chatbot-pulse-green {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }

    #chatbot-close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 20px;
      cursor: pointer;
      transition: color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }

    #chatbot-close-btn:hover {
      color: white;
    }

    /* Message area body */
    #chatbot-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background-color: #fcfcfc;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    /* Scrollbars styling */
    #chatbot-body::-webkit-scrollbar {
      width: 5px;
    }
    #chatbot-body::-webkit-scrollbar-track {
      background: transparent;
    }
    #chatbot-body::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.08);
      border-radius: 3px;
    }
    #chatbot-body::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.15);
    }

    /* Message styling */
    .chatbot-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.45;
      word-wrap: break-word;
      animation: chatbot-fade-in 0.25s ease forwards;
    }

    @keyframes chatbot-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .chatbot-msg.bot {
      background: white;
      color: #2F2F2F;
      align-self: flex-start;
      border-bottom-left-radius: 2px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .chatbot-msg.user {
      background: #405a52; /* pine green */
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 2px;
      box-shadow: 0 2px 6px rgba(64, 90, 82, 0.12);
    }

    .chatbot-link {
      color: #EE672F;
      text-decoration: none;
      font-weight: bold;
    }

    .chatbot-link:hover {
      text-decoration: underline;
      color: #F89C66;
    }

    /* Typing indicator styling */
    .chatbot-typing {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      background: white;
      border-radius: 12px;
      border-bottom-left-radius: 2px;
      align-self: flex-start;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .chatbot-typing span {
      width: 6px;
      height: 6px;
      background: #a5a5a5;
      border-radius: 50%;
      animation: chatbot-bounce 1.4s infinite ease-in-out both;
    }

    .chatbot-typing span:nth-child(1) { animation-delay: -0.32s; }
    .chatbot-typing span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes chatbot-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    /* Quick Reply Chips */
    .chatbot-quick-replies {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
      width: 100%;
    }

    .chatbot-chip {
      padding: 7px 12px;
      background: white;
      color: #405a52;
      border: 1px solid rgba(64, 90, 82, 0.25);
      border-radius: 18px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      width: fit-content;
      max-width: 95%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .chatbot-chip:hover {
      background: #405a52;
      color: white;
      border-color: #405a52;
      transform: translateX(4px);
      box-shadow: 0 3px 6px rgba(64, 90, 82, 0.15);
    }

    /* Input area styling */
    #chatbot-input-area {
      padding: 10px 14px;
      background: white;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #chatbot-input-field {
      flex: 1;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 13px;
      outline: none;
      font-family: inherit;
      background: #fcfcfc;
      transition: border-color 0.2s, background-color 0.2s;
    }

    #chatbot-input-field:focus {
      border-color: #EE672F;
      background: white;
    }

    #chatbot-send-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #EE672F;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s, transform 0.1s;
    }

    #chatbot-send-btn:hover {
      background: #F89C66;
      transform: scale(1.05);
    }

    #chatbot-send-btn svg {
      width: 14px;
      height: 14px;
      fill: white;
    }

    @media (max-width: 480px) {
      #chatbot-container {
        bottom: 15px;
        right: 15px;
      }
      #chatbot-window {
        width: calc(100vw - 30px);
        height: calc(100vh - 100px);
        bottom: 68px;
        right: 0;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // 4. Construction de l'interface DOM
  const container = document.createElement('div');
  container.id = 'chatbot-container';

  // FAB (Bouton d'ouverture)
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'chatbot-toggle-btn';
  toggleBtn.title = isEnglish ? "Chat with us" : "Discutez avec nous";
  toggleBtn.innerHTML = `
    <!-- Icone bulle de discussion -->
    <svg class="chat-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
    </svg>
    <!-- Icone fermer -->
    <svg class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  `;

  // Fenêtre de discussion
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chatbot-window';
  chatWindow.innerHTML = `
    <div id="chatbot-header">
      <div id="chatbot-header-info">
        <div class="chatbot-avatar">
          <!-- Icone type sceau/tampon laiton -->
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
          </svg>
        </div>
        <div id="chatbot-header-text">
          <h4>${isEnglish ? "AM Marquage Assistant" : "Assistant AM Marquage"}</h4>
          <div class="chatbot-status">
            <span class="chatbot-status-dot"></span>
            <span>${isEnglish ? "Online • Instant reply" : "En ligne • Répond instantanément"}</span>
          </div>
        </div>
      </div>
      <button id="chatbot-close-btn" aria-label="${isEnglish ? "Close chat" : "Fermer le chat"}">&times;</button>
    </div>
    <div id="chatbot-body"></div>
    <div id="chatbot-input-area">
      <input type="text" id="chatbot-input-field" placeholder="${isEnglish ? "Ask a question..." : "Posez une question..."}" autocomplete="off">
      <button id="chatbot-send-btn" aria-label="${isEnglish ? "Send" : "Envoyer"}">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  `;

  container.appendChild(toggleBtn);
  container.appendChild(chatWindow);
  document.body.appendChild(container);

  const body = chatWindow.querySelector('#chatbot-body');
  const input = chatWindow.querySelector('#chatbot-input-field');
  const sendBtn = chatWindow.querySelector('#chatbot-send-btn');
  const closeBtn = chatWindow.querySelector('#chatbot-close-btn');

  // 6. Mesure d'usage (Umami, sans cookie)
  //    Trois evenements : ouverture, question posee, question sans reponse.
  function track(name, data) {
    try {
      if (window.umami && typeof window.umami.track === 'function') {
        window.umami.track(name, data || {});
      }
    } catch (e) { /* la mesure ne doit jamais casser le chat */ }
  }

  // 5. Fonctions d'interaction
  function toggleChat() {
    const isOpen = chatWindow.classList.toggle('open');
    toggleBtn.classList.toggle('open');
    if (isOpen) {
      track('chatbot_ouvert');
      input.focus();
      // Si la conversation est vide, on injecte le message d'accueil
      if (body.children.length === 0) {
        showBotWelcome();
      }
    }
  }

  toggleBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Formattage du texte (Markdown simplifié)
  function formatText(text) {
    let formatted = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="chatbot-link">$1</a>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  // Affiche le message de bienvenue avec ses boutons rapides
  function showBotWelcome() {
    appendMsg(currentDb.welcome, 'bot');
    showQuickReplies();
  }

  // Crée et affiche les puces rapides sous forme de boutons
  function showQuickReplies() {
    const repliesContainer = document.createElement('div');
    repliesContainer.className = 'chatbot-quick-replies';

    currentDb.faq.forEach(item => {
      const chip = document.createElement('button');
      chip.className = 'chatbot-chip';
      chip.textContent = item.title;
      chip.addEventListener('click', () => {
        track('chatbot_sujet', { sujet: item.title.slice(0, 80) });
        // Envoie la question comme un message de l'utilisateur
        appendMsg(item.title, 'user');
        // Supprime les quick replies après le clic pour ne pas encombrer
        repliesContainer.remove();
        // Réponse automatique avec simulateur de frappe
        triggerBotResponse(item.response);
      });
      repliesContainer.appendChild(chip);
    });

    body.appendChild(repliesContainer);
    scrollToBottom();
  }

  // Ajoute une bulle de message au corps du chat
  function appendMsg(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chatbot-msg ${sender}`;
    bubble.innerHTML = formatText(text);
    body.appendChild(bubble);
    scrollToBottom();
  }

  // Affiche un indicateur de frappe (typing dots) temporaire
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chatbot-typing';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(indicator);
    scrollToBottom();
    return indicator;
  }

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  // Simule l'écriture du bot pendant un court instant avant de répondre
  function triggerBotResponse(responseText, forceShowQuickReplies = false) {
    const indicator = showTypingIndicator();
    setTimeout(() => {
      indicator.remove();
      appendMsg(responseText, 'bot');
      if (forceShowQuickReplies) {
        showQuickReplies();
      }
    }, 600);
  }

  // Algorithme de recherche par mots-clés
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9 ]/g, " "); // Supprime la ponctuation
  }

  // Distance d'edition : tolere les fautes de frappe (mattoir / matoir).
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur.slice();
    }
    return prev[b.length];
  }

  // Tolerance selon la longueur du mot
  function isCloseEnough(word, keyword) {
    var d = levenshtein(word, keyword);
    if (keyword.length >= 7) return d <= 2;
    if (keyword.length >= 4) return d <= 1;
    return d === 0;
  }

  // Synonymes : ce que les gens tapent -> vocabulaire des mots-cles
  var SYNONYMES = {
    "fdp": "livraison", "port": "livraison", "envoi": "livraison", "expedition": "livraison",
    "delais": "delai", "delais": "delai", "rapidite": "delai",
    "cout": "prix", "coute": "prix", "tarifs": "tarif", "budget": "prix",
    "mattoir": "matoir", "mattoirs": "matoir", "tampons": "tampon",
    "logo": "fichier", "visuel": "fichier", "vectorise": "vectoriel",
    "telephone": "telephone", "tel": "telephone", "mail": "email",
    "acheter": "commander", "commande": "commander"
  };

  function expandSynonyms(words) {
    var out = [];
    words.forEach(function (w) {
      out.push(w);
      if (SYNONYMES[w] && out.indexOf(SYNONYMES[w]) === -1) out.push(SYNONYMES[w]);
    });
    return out;
  }

  function handleUserInput() {
    const query = input.value.trim();
    if (!query) return;

    // Affiche le message de l'utilisateur
    track('chatbot_question', { question: query.slice(0, 120) });
    appendMsg(query, 'user');
    input.value = '';

    // Recherche de correspondance dans la FAQ
    const normalizedQuery = normalizeText(query);
    const queryWords = expandSynonyms(normalizedQuery.split(/\s+/).filter(w => w.length > 1));

    // Si c'est un salut simple
    const greetings = isEnglish ? ["hello", "hi", "hey", "morning", "welcome"] : ["salut", "bonjour", "hey", "bonsoir", "coucou", "slt"];
    const isGreeting = queryWords.some(w => greetings.includes(w)) && queryWords.length <= 2;

    if (isGreeting) {
      triggerBotResponse(currentDb.welcome, true);
      return;
    }

    let bestMatch = null;
    let maxMatches = 0;

    currentDb.faq.forEach(item => {
      let matches = 0;
      item.keywords.forEach(keyword => {
        // Normalise le mot-clé
        const normalizedKeyword = normalizeText(keyword);
        // Un mot-cle court ("ai", "pdf") ne doit pas matcher n'importe quelle
        // sous-chaine ("faites" contient "ai") : inclusion reservee aux mots-cles
        // de 4 caracteres et plus ; les autres doivent etre un mot entier.
        const isWholeWord = queryWords.indexOf(normalizedKeyword) !== -1;
        if ((normalizedKeyword.length >= 4 && normalizedQuery.includes(normalizedKeyword)) || isWholeWord) {
          matches += 2; // Poids plus fort si le mot-clé exact est dans la requête
        } else {
          // Sinon on vérifie l'inclusion de mots individuels
          const keywordWords = normalizedKeyword.split(/\s+/);
          keywordWords.forEach(kw => {
            if (queryWords.includes(kw)) {
              matches += 1;
            } else if (kw.length >= 4 && queryWords.some(w => isCloseEnough(w, kw))) {
              matches += 1;   // faute de frappe toleree
            }
          });
        }
      });

      // Un sujet peut declarer des mots-cles decisifs : "plaque" doit
      // l'emporter sur le sujet generique des tarifs.
      if (item.boost && item.boost.some(function (b) { return normalizedQuery.indexOf(normalizeText(b)) !== -1; })) {
        matches += 5;
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = item;
      }
    });

    // Seuil de pertinence : 2 points, ou 1 si la question est tres courte
    // (un seul mot, eventuellement mal orthographie : "mattoir")
    var seuil = queryWords.length <= 2 ? 1 : 2;
    if (bestMatch && maxMatches >= seuil) {
      triggerBotResponse(bestMatch.response);
    } else {
      // Pas de correspondance claire
      track('chatbot_sans_reponse', { question: query.slice(0, 120) });
      triggerBotResponse(currentDb.fallback, true);
    }
  }

  // Événements d'envoi
  sendBtn.addEventListener('click', handleUserInput);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleUserInput();
    }
  });
})();
