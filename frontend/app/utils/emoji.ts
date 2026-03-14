/**
 * foodEmojiMatcher.ts
 *
 * Maps food & drink names to emojis using regular expressions.
 * Covers the complete Unicode "Food & Drink" block (U+1F347–U+1F9CB)
 * plus adjacent food-related codepoints, ordered by Unicode sequence.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FoodEmojiRule {
  /** Emoji character */
  emoji: string;
  /** Human-readable category / food name */
  label: string;
  /** Regex that matches relevant food/drink names (case-insensitive) */
  pattern: RegExp;
}

// ─── Rule Table ──────────────────────────────────────────────────────────────
// Rules are ordered by Unicode code-point (U+1F347 …).
// The FIRST matching rule wins, so more-specific rules come first within groups.

export const FOOD_EMOJI_RULES: FoodEmojiRule[] = [
  // ── Fruits ────────────────────────────────────────────────────────────────

  {
    emoji: "🍇",
    label: "Grapes",
    pattern: /\b(grapes?|muscatel|concord\s*grape|raisin)\b/i,
  },

  {
    emoji: "🍈",
    label: "Melon",
    pattern: /\b(melon|honeydew|cantaloupe|cantaloup|galia|canary\s*melon)\b/i,
  },

  { emoji: "🍉", label: "Watermelon", pattern: /\b(watermelon)\b/i },

  {
    emoji: "🍊",
    label: "Tangerine / Mandarin",
    pattern: /\b(tangerine|mandarin|clementine|satsuma|orange)\b/i,
  },

  { emoji: "🍋", label: "Lemon", pattern: /\b(lemon|citron)\b/i },

  { emoji: "🍋‍🟩", label: "Lime", pattern: /\b(lime|key\s*lime)\b/i },

  { emoji: "🍌", label: "Banana", pattern: /\b(banana|plantain)\b/i },

  { emoji: "🍍", label: "Pineapple", pattern: /\b(pineapple|ananas)\b/i },

  { emoji: "🥭", label: "Mango", pattern: /\b(mango|alphonso|ataulfo)\b/i },

  {
    emoji: "🍎",
    label: "Red Apple",
    pattern: /\b(red\s*apple|gala|fuji|honeycrisp|macintosh\s*apple|apple)\b/i,
  },

  {
    emoji: "🍏",
    label: "Green Apple",
    pattern: /\b(green\s*apple|granny\s*smith|tart\s*apple)\b/i,
  },

  { emoji: "🍐", label: "Pear", pattern: /\b(pear|bartlett|bosc|anjou)\b/i },

  { emoji: "🍑", label: "Peach", pattern: /\b(peach|nectarine)\b/i },

  { emoji: "🍒", label: "Cherries", pattern: /\b(cherr(y|ies)|maraschino)\b/i },

  { emoji: "🍓", label: "Strawberry", pattern: /\b(strawberr(y|ies))\b/i },

  {
    emoji: "🫐",
    label: "Blueberries",
    pattern: /\b(blueberr(y|ies)|bilberr(y|ies))\b/i,
  },

  { emoji: "🥝", label: "Kiwi", pattern: /\b(kiwi|kiwifruit)\b/i },

  {
    emoji: "🍅",
    label: "Tomato",
    pattern: /\b(tomato(es)?|cherry\s*tomato|san\s*marzano|roma\s*tomato)\b/i,
  },

  {
    emoji: "🫒",
    label: "Olive",
    pattern: /\b(olive|kalamata|castelvetrano)\b/i,
  },

  {
    emoji: "🥥",
    label: "Coconut",
    pattern:
      /\b(coconut|coconut\s*milk|coconut\s*cream|desiccated\s*coconut)\b/i,
  },

  // ── Vegetables ────────────────────────────────────────────────────────────

  { emoji: "🥑", label: "Avocado", pattern: /\b(avocado|guacamole|avo)\b/i },

  {
    emoji: "🍆",
    label: "Eggplant / Aubergine",
    pattern: /\b(eggplant|aubergine|brinjal)\b/i,
  },

  {
    emoji: "🥔",
    label: "Potato",
    pattern: /\b(potato(es)?|spud|tater|mashed\s*potato|baked\s*potato)\b/i,
  },

  { emoji: "🥕", label: "Carrot", pattern: /\b(carrot.*|baby\s*carrot)\b/i },

  {
    emoji: "🌽",
    label: "Corn",
    pattern: /\b(corn|maize|sweetcorn|corn\s*on\s*the\s*cob|popcorn)\b/i,
  },

  {
    emoji: "🌶️",
    label: "Hot Pepper / Chilli",
    pattern:
      /\b(chilli|chili|hot\s*pepper|jalape[nn]o|habanero|cayenne|serrano|bird.s\s*eye|red\s*pepper\s*flakes)\b/i,
  },

  {
    emoji: "🫑",
    label: "Bell Pepper / Capsicum",
    pattern:
      /\b(bell\s*pepper|capsicum|sweet\s*pepper|red\s*pepper|green\s*pepper|yellow\s*pepper)\b/i,
  },

  { emoji: "🥒", label: "Cucumber", pattern: /\b(cucumber|gherkin|pickle)\b/i },

  {
    emoji: "🥬",
    label: "Leafy Green",
    pattern:
      /\b(lettuce|kale|spinach|chard|arugula|rocket|bok\s*choy|pak\s*choi|collard|watercress|endive|radicchio|swiss\s*chard|leafy\s*green|celery)\b/i,
  },

  { emoji: "🥦", label: "Broccoli", pattern: /\b(broccoli|broccolini)\b/i },

  {
    emoji: "🧄",
    label: "Garlic",
    pattern: /\b(garlic|garlic\s*bread|garlic\s*butter|aioli)\b/i,
  },

  {
    emoji: "🧅",
    label: "Onion",
    pattern:
      /\b(onion|shallot|scallion|spring\s*onion|red\s*onion|white\s*onion|leek)\b/i,
  },

  {
    emoji: "🥜",
    label: "Peanuts",
    pattern: /\b(peanut|groundnut|peanut\s*butter)\b/i,
  },

  {
    emoji: "🫘",
    label: "Beans / Legumes",
    pattern:
      /\b(bean|black\s*bean|kidney\s*bean|chickpea|lentil.*|edamame|soybeans?|broad\s*bean|lima\s*bean|cannellini)\b/i,
  },

  { emoji: "🌰", label: "Chestnut", pattern: /\b(chestnut|marron)\b/i },

  {
    emoji: "🍄",
    label: "Mushroom",
    pattern:
      /\b(mushroom|portobello|shiitake|chanterelle|oyster\s*mushroom|porcini|cremini|enoki)\b/i,
  },

  {
    emoji: "🪸",
    label: "Seaweed",
    pattern: /\b(seaweed|nori|kelp|wakame|kombu|sea\s*vegetable)\b/i,
  },

  // ── Bread & Baked Goods ───────────────────────────────────────────────────

  {
    emoji: "🍞",
    label: "Bread",
    pattern:
      /\b(bread|sourdough|white\s*bread|wholemeal|rye\s*bread|multigrain|ciabatta|focaccia|toast)\b/i,
  },

  {
    emoji: "🥐",
    label: "Croissant",
    pattern: /\b(croissant|pain\s*au\s*chocolat)\b/i,
  },

  {
    emoji: "🥖",
    label: "Baguette",
    pattern: /\b(baguette|french\s*bread|french\s*stick)\b/i,
  },

  {
    emoji: "🫓",
    label: "Flatbread",
    pattern:
      /\b(flatbread|pita|pitta|naan|roti|chapati|tortilla|lavash|injera)\b/i,
  },

  { emoji: "🥨", label: "Pretzel", pattern: /\b(pretzel|bretzel)\b/i },

  { emoji: "🥯", label: "Bagel", pattern: /\b(bagel|bialy)\b/i },

  {
    emoji: "🥞",
    label: "Pancakes",
    pattern: /\b(pancake|hotcake|flapjack|crepe|crepe|blini|pikelet)\b/i,
  },

  { emoji: "🧇", label: "Waffle", pattern: /\b(waffle|belgian\s*waffle)\b/i },

  // ── Dairy & Eggs ──────────────────────────────────────────────────────────

  {
    emoji: "🧀",
    label: "Cheese",
    pattern:
      /\b(cheese|cheddar|mozzarella|parmesan|brie|camembert|gouda|feta|ricotta|cottage\s*cheese|cream\s*cheese|gruyere|emmental|roquefort|gorgonzola|manchego|halloumi|pecorino|colby)\b/i,
  },

  {
    emoji: "🥚",
    label: "Egg",
    pattern:
      /\b(egg|eggs|omelette|omelet|scrambled\s*egg|poached\s*egg|fried\s*egg|hard.boiled|soft.boiled|deviled\s*egg|quiche|frittata|benedict)\b/i,
  },

  {
    emoji: "🧈",
    label: "Butter",
    pattern: /\b(butter|buttermilk|clarified\s*butter|ghee)\b/i,
  },

  {
    emoji: "🥛",
    label: "Milk",
    pattern:
      /\b(milk|whole\s*milk|skim\s*milk|oat\s*milk|almond\s*milk|soy\s*milk|lactose.free|dairy\s*milk)\b/i,
  },

  // ── Meat & Seafood ────────────────────────────────────────────────────────

  {
    emoji: "🍗",
    label: "Poultry / Chicken",
    pattern:
      /\b(chicken|hen|poultry|rotisserie|nuggets?|thigh|fried\s*chicken|grilled\s*chicken|turkey)\b/i,
  },

  {
    emoji: "🍖",
    label: "Meat on Bone",
    pattern:
      /\b(meat\s*on\s*bone|leg\s*of\s*lamb|rack\s*of\s*ribs?|turkey\s*leg|osso\s*buco)\b/i,
  },

  {
    emoji: "🥩",
    label: "Cut of Meat",
    pattern:
      /\b(beef|pork|steak|lamb|veal|venison|brisket|ribs?|sausage|meatball|mince|ground\s*meat|pork\s*belly|tenderloin|sirloin|ribeye|t-bone|filet\s*mignon)\b/i,
  },

  {
    emoji: "🥓",
    label: "Bacon",
    pattern:
      /\b(bacon|pancetta|prosciutto|lardons?|streaky\s*bacon|back\s*bacon|ham)\b/i,
  },

  {
    emoji: "🦀",
    label: "Crab",
    pattern: /\b(crab|king\s*crab|dungeness|soft.shell\s*crab|crab\s*cake)\b/i,
  },

  {
    emoji: "🦞",
    label: "Lobster",
    pattern: /\b(lobster|crayfish|crawfish|langoustine|rock\s*lobster)\b/i,
  },

  {
    emoji: "🦐",
    label: "Shrimp / Prawn",
    pattern: /\b(shrimp|prawn|tiger\s*prawn|king\s*prawn)\b/i,
  },

  {
    emoji: "🦑",
    label: "Squid / Calamari",
    pattern: /\b(squid|calamari|cuttlefish)\b/i,
  },

  { emoji: "🦪", label: "Oyster", pattern: /\b(oyster)\b/i },

  {
    emoji: "🐟",
    label: "Fish",
    pattern:
      /\b(fish|salmon|tuna|cod|halibut|tilapia|trout|sardine|anchovy|mackerel|bass|catfish|snapper|swordfish|mahi)\b/i,
  },

  {
    emoji: "🍤",
    label: "Fried Shrimp",
    pattern:
      /\b(fried\s*shrimp|ebi\s*fry|prawn\s*tempura|scampi|shrimp\s*cocktail|tempura\s*prawn)\b/i,
  },

  // ── Fast Food ─────────────────────────────────────────────────────────────

  {
    emoji: "🍔",
    label: "Burger",
    pattern: /\b(burger|hamburger|cheeseburger|veggie\s*burger|patty)\b/i,
  },

  {
    emoji: "🍟",
    label: "French Fries",
    pattern: /\b(french\s*fries?|fries?|chips|wedges|steak\s*fries?)\b/i,
  },

  {
    emoji: "🌭",
    label: "Hot Dog",
    pattern: /\b(hot\s*dog|hotdog|frankfurter|bratwurst|wiener|corn\s*dog)\b/i,
  },

  {
    emoji: "🍕",
    label: "Pizza",
    pattern: /\b(pizza|margherita|pepperoni|calzone|deep.dish|neapolitan)\b/i,
  },

  { emoji: "🌮", label: "Taco", pattern: /\b(taco|tacos|wrap|wraps)\b/i },

  {
    emoji: "🌯",
    label: "Burrito / Wrap",
    pattern: /\b(burrito|fajita|quesadilla|enchilada|chimichanga|nachos?)\b/i,
  },

  {
    emoji: "🫔",
    label: "Tamale / Wrap",
    pattern: /\b(tamale|tamal|shawarma|doner|kebab\s*wrap)\b/i,
  },

  {
    emoji: "🥙",
    label: "Stuffed Flatbread / Gyro",
    pattern: /\b(gyro|gyros|souvlaki|falafel\s*wrap|stuffed\s*pita|donor)\b/i,
  },

  { emoji: "🧆", label: "Falafel", pattern: /\b(falafel)\b/i },

  // ── Prepared / Cooked Dishes ──────────────────────────────────────────────

  {
    emoji: "🍳",
    label: "Frying Pan",
    pattern: /\b(stir.?fry|pan.fried|sunny.side|over.easy|skillet\s*meal)\b/i,
  },

  {
    emoji: "🥘",
    label: "Paella / Shallow Pan",
    pattern: /\b(paella|tagine|shakshuka|one.pan)\b/i,
  },

  {
    emoji: "🍲",
    label: "Stew / Casserole",
    pattern:
      /\b(stew|hotpot|hot\s*pot|casserole|pot\s*roast|irish\s*stew|boeuf\s*bourguignon|pot.au.feu)\b/i,
  },

  {
    emoji: "🫕",
    label: "Fondue",
    pattern: /\b(fondue|cheese\s*fondue|chocolate\s*fondue)\b/i,
  },

  {
    emoji: "🥣",
    label: "Bowl with Spoon",
    pattern:
      /\b(cereal|oatmeal|porridge|granola|muesli|acai\s*bowl|smoothie\s*bowl|overnight\s*oats)\b/i,
  },

  {
    emoji: "🥗",
    label: "Green Salad",
    pattern:
      /\b(salad|caesar|greek\s*salad|garden\s*salad|coleslaw|nicoise|waldorf|caprese)\b/i,
  },

  {
    emoji: "🍿",
    label: "Popcorn",
    pattern: /\b(popcorn|caramel\s*popcorn)\b/i,
  },

  {
    emoji: "🧂",
    label: "Salt",
    pattern: /\b(salt|kosher\s*salt|sea\s*salt|himalayan\s*salt)\b/i,
  },

  {
    emoji: "🥫",
    label: "Canned Food",
    pattern: /\b(canned|tinned|tin\s*of|baked\s*beans)\b/i,
  },

  // ── Asian Foods ───────────────────────────────────────────────────────────

  {
    emoji: "🍱",
    label: "Bento Box",
    pattern: /\b(bento|bento\s*box|lunchbox)\b/i,
  },

  {
    emoji: "🍘",
    label: "Rice Cracker",
    pattern: /\b(rice\s*cracker|senbei|arare)\b/i,
  },

  {
    emoji: "🍙",
    label: "Rice Ball",
    pattern: /\b(onigiri|rice\s*ball|musubi)\b/i,
  },

  {
    emoji: "🍚",
    label: "Cooked Rice",
    pattern:
      /\b(rice|steamed\s*rice|white\s*rice|brown\s*rice|jasmine\s*rice|basmati)\b/i,
  },

  {
    emoji: "🍛",
    label: "Curry",
    pattern:
      /\b(curry|korma|tikka\s*masala|vindaloo|dal|dahl|massaman|green\s*curry|red\s*curry|yellow\s*curry|biryani|pilaf|pilau)\b/i,
  },

  {
    emoji: "🍜",
    label: "Noodles",
    pattern:
      /\b(noodle|ramen|udon|soba|pho|pad\s*thai|lo\s*mein|chow\s*mein|yakisoba|laksa|mee\s*goreng|glass\s*noodle|vermicelli|rice\s*noodle)\b/i,
  },

  {
    emoji: "🍝",
    label: "Pasta / Spaghetti",
    pattern:
      /\b(spaghetti|pasta|linguine|fettuccine|tagliatelle|pappardelle|penne|rigatoni|farfalle|fusilli|ravioli|tortellini|gnocchi|lasagna|lasagne|carbonara|bolognese|alfredo|cacio\s*e\s*pepe|amatriciana)\b/i,
  },

  {
    emoji: "🍠",
    label: "Sweet Potato",
    pattern: /\b(sweet\s*potato|yam|kumara)\b/i,
  },

  { emoji: "🍢", label: "Oden", pattern: /\b(oden|kamaboko|naruto\s*cake)\b/i },

  {
    emoji: "🍣",
    label: "Sushi",
    pattern:
      /\b(sushi|sashimi|maki|nigiri|temaki|hand\s*roll|omakase|chirashi)\b/i,
  },

  {
    emoji: "🍥",
    label: "Fish Cake",
    pattern: /\b(fish\s*cake|fishcake|narutomaki|surimi)\b/i,
  },

  { emoji: "🥮", label: "Moon Cake", pattern: /\b(moon\s*cake|mooncake)\b/i },

  { emoji: "🍡", label: "Dango", pattern: /\b(dango|mitarashi)\b/i },

  {
    emoji: "🥟",
    label: "Dumpling",
    pattern:
      /\b(dumpling|gyoza|potsticker|dim\s*sum|wonton|jiaozi|har\s*gow|shumai|xiaolongbao|mandu|pierogi|pelmeni)\b/i,
  },

  { emoji: "🥠", label: "Fortune Cookie", pattern: /\b(fortune\s*cookie)\b/i },

  {
    emoji: "🥡",
    label: "Takeout Box",
    pattern:
      /\b(takeout|take.out|takeaway|take.away|chinese\s*takeaway|takeaway\s*box)\b/i,
  },

  // ── Sweets & Desserts ─────────────────────────────────────────────────────

  {
    emoji: "🍦",
    label: "Soft Ice Cream",
    pattern:
      /\b(soft.serve|soft\s*ice\s*cream|frozen\s*yogurt|froyo|whippy)\b/i,
  },

  {
    emoji: "🍧",
    label: "Shaved Ice",
    pattern: /\b(shaved\s*ice|snow\s*cone|kakigori|granita|raspa)\b/i,
  },

  {
    emoji: "🍨",
    label: "Ice Cream",
    pattern: /\b(ice\s*cream|gelato|sundae|sorbet|sherbet|neapolitan\s*ice)\b/i,
  },

  {
    emoji: "🍩",
    label: "Doughnut",
    pattern: /\b(doughnut|donut|cruller|beignet|fritter)\b/i,
  },

  {
    emoji: "🍪",
    label: "Cookie",
    pattern:
      /\b(cookie|biscuit|shortbread|oatmeal\s*cookie|chocolate\s*chip\s*cookie|snickerdoodle|macaroon)\b/i,
  },

  {
    emoji: "🎂",
    label: "Birthday Cake",
    pattern: /\b(birthday\s*cake|celebration\s*cake|layer\s*cake)\b/i,
  },

  {
    emoji: "🍰",
    label: "Cake Slice",
    pattern:
      /\b(shortcake|cake\s*slice|sponge\s*cake|victoria\s*sponge|cheesecake|gateau|torte|cake)\b/i,
  },

  { emoji: "🧁", label: "Cupcake", pattern: /\b(cupcake|fairy\s*cake)\b/i },

  {
    emoji: "🥧",
    label: "Pie",
    pattern:
      /\b(pie|tart|quiche|galette|cobbler|crumble|apple\s*pie|pumpkin\s*pie|pecan\s*pie|lemon\s*tart|custard\s*tart|flan)\b/i,
  },

  {
    emoji: "🍫",
    label: "Chocolate",
    pattern:
      /\b(chocolate|cocoa|cacao|brownie|fudge|truffle|bonbon|praline|ganache|nougat)\b/i,
  },

  {
    emoji: "🍬",
    label: "Candy",
    pattern:
      /\b(candy|sweets|gummy|jelly\s*bean|hard\s*candy|toffee|caramel|butterscotch|rock\s*candy|taffy|licorice|liquorice)\b/i,
  },

  { emoji: "🍭", label: "Lollipop", pattern: /\b(lollipop|lolly|sucker)\b/i },

  {
    emoji: "🍮",
    label: "Custard / Pudding",
    pattern:
      /\b(custard|pudding|creme\s*caramel|panna\s*cotta|blancmange|bread\s*pudding)\b/i,
  },

  {
    emoji: "🍯",
    label: "Honey",
    pattern: /\b(honey|honeycomb|manuka|raw\s*honey)\b/i,
  },

  // ── Hot Drinks ────────────────────────────────────────────────────────────

  {
    emoji: "☕",
    label: "Coffee",
    pattern:
      /\b(coffee|espresso|latte|cappuccino|americano|mocha|macchiato|flat\s*white|long\s*black|ristretto|cortado|cold\s*brew|affogato)\b/i,
  },

  {
    emoji: "🫖",
    label: "Tea",
    pattern:
      /\b(tea|green\s*tea|black\s*tea|herbal\s*tea|chai|chamomile|peppermint\s*tea|earl\s*grey|oolong|rooibos|teapot|infusion|english\s*breakfast)\b/i,
  },

  {
    emoji: "🍵",
    label: "Matcha / Cup of Tea",
    pattern: /\b(matcha|sencha|hojicha|jasmine\s*tea|cup\s*of\s*tea|pu.erh)\b/i,
  },

  // ── Cold Drinks ───────────────────────────────────────────────────────────

  {
    emoji: "🧃",
    label: "Juice",
    pattern:
      /\b(juice|apple\s*juice|orange\s*juice|cranberry\s*juice|grape\s*juice|vegetable\s*juice)\b/i,
  },

  {
    emoji: "🥤",
    label: "Cup with Straw",
    pattern:
      /\b(soda|cola|lemonade|fizzy\s*drink|soft\s*drink|iced\s*tea|smoothie|milkshake|frappuccino|slushie|slurpee)\b/i,
  },

  {
    emoji: "🧋",
    label: "Bubble Tea",
    pattern:
      /\b(bubble\s*tea|boba|tapioca\s*tea|pearl\s*milk\s*tea|taro\s*milk\s*tea)\b/i,
  },

  // ── Alcoholic Drinks ──────────────────────────────────────────────────────

  { emoji: "🍶", label: "Sake", pattern: /\b(sake|sake|nigori|mirin)\b/i },

  {
    emoji: "🍾",
    label: "Champagne",
    pattern: /\b(champagne|prosecco|cava|sparkling\s*wine|cremant)\b/i,
  },

  {
    emoji: "🍷",
    label: "Wine",
    pattern:
      /\b(wine|red\s*wine|white\s*wine|rose\s*wine|merlot|cabernet|pinot\s*noir|chardonnay|sauvignon|riesling|malbec|shiraz|syrah|zinfandel|chianti)\b/i,
  },

  {
    emoji: "🍸",
    label: "Cocktail",
    pattern:
      /\b(cocktail|martini|cosmopolitan|negroni|old\s*fashioned|daiquiri|margarita|mojito|manhattan|aperol\s*spritz|espresso\s*martini|gin\s*tonic)\b/i,
  },

  {
    emoji: "🍹",
    label: "Tropical Drink",
    pattern:
      /\b(pina\s*colada|mai\s*tai|tiki\s*drink|tropical\s*drink|hurricane\s*cocktail|sangria)\b/i,
  },

  {
    emoji: "🧉",
    label: "Mate",
    pattern: /\b(mate|yerba\s*mate|chimarrao|terere)\b/i,
  },

  {
    emoji: "🍺",
    label: "Beer",
    pattern:
      /\b(beer|lager|ale|stout|porter|IPA|pilsner|wheat\s*beer|hefeweizen|pale\s*ale|craft\s*beer|draught|draft)\b/i,
  },

  {
    emoji: "🍻",
    label: "Clinking Beers",
    pattern: /\b(beers|pints?|two\s*beers|round\s*of\s*drinks)\b/i,
  },

  {
    emoji: "🥂",
    label: "Champagne Toast",
    pattern: /\b(cheers|clinking\s*glass|celebrat\w+\s*drink|toast\s*with)\b/i,
  },

  {
    emoji: "🥃",
    label: "Whisky / Spirits",
    pattern:
      /\b(whisky|whiskey|bourbon|scotch|rye\s*whiskey|single\s*malt|brandy|cognac|armagnac|calvados|rum|vodka|gin|tequila|mezcal|absinthe)\b/i,
  },

  // ── Condiments & Pantry ───────────────────────────────────────────────────

  {
    emoji: "🫙",
    label: "Jar / Condiment",
    pattern:
      /\b(jam|jelly|marmalade|preserve|pickle\s*jar|mustard|ketchup|relish|chutney|hot\s*sauce|sriracha|tahini|miso\s*paste|spread|mayonnaise|mayo)\b/i,
  },

  {
    emoji: "🫗",
    label: "Pouring",
    pattern: /\b(drizzle|vinaigrette|dressing|pouring|splash)\b/i,
  },
];

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Returns the first matching emoji for a given food/drink name.
 * Returns `null` if no rule matches.
 */
export function getFoodEmoji(foodName: string): string | null {
  for (const rule of FOOD_EMOJI_RULES) {
    if (rule.pattern.test(foodName)) {
      return rule.emoji;
    }
  }
  return null;
}

/**
 * Returns `{ emoji, label }` for the first matching rule,
 * or `null` if no rule matches.
 */
export function getFoodEmojiResult(
  foodName: string,
): { emoji: string; label: string } | null {
  for (const rule of FOOD_EMOJI_RULES) {
    if (rule.pattern.test(foodName)) {
      return { emoji: rule.emoji, label: rule.label };
    }
  }
  return null;
}

/**
 * Returns ALL matching rules for a food/drink name.
 * Useful when an item could belong to multiple categories (e.g. "sake").
 */
export function getAllFoodEmojiMatches(
  foodName: string,
): Array<{ emoji: string; label: string }> {
  return FOOD_EMOJI_RULES.filter((r) => r.pattern.test(foodName)).map(
    ({ emoji, label }) => ({ emoji, label }),
  );
}

/**
 * Annotates every food/drink word found in free-form text with its emoji.
 *
 * "chicken and pasta for dinner"
 * → "🍗 chicken and 🍝 pasta for dinner"
 */
export function annotateFoodString(text: string): string {
  let result = text;
  const seen = new Set<string>();
  for (const rule of FOOD_EMOJI_RULES) {
    const globalPattern = new RegExp(rule.pattern.source, "gi");
    result = result.replace(globalPattern, (match) => {
      const key = match.toLowerCase();
      if (seen.has(key)) return match;
      seen.add(key);
      return `${rule.emoji} ${match}`;
    });
  }
  return result;
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

const testCases: string[] = [
  // Fruits
  "Grapes",
  "Watermelon",
  "Tangerine",
  "Mango",
  "Kiwifruit",
  "Blueberries",
  "Coconut",
  "Lime",
  // Vegetables
  "Avocado",
  "Jalapeno",
  "Capsicum",
  "Edamame",
  "Shiitake Mushroom",
  "Broccoli",
  "Garlic",
  "Leek",
  // Proteins
  "Chicken Tikka Masala",
  "Beef Wellington",
  "Pork Belly",
  "Steak au Poivre",
  "Salmon Fillet",
  "Tiger Prawn",
  "Dungeness Crab",
  "Oysters",
  "Calamari",
  // Carbs / Grains
  "Sourdough Bread",
  "Baguette",
  "Croissant",
  "Bagel",
  "Biryani",
  // Prepared dishes
  "Spaghetti Carbonara",
  "Pad Thai",
  "Gyoza",
  "Paella",
  "Caesar Salad",
  "Ramen",
  "Xiaolongbao",
  "Bento Box",
  "Sushi",
  "Moon Cake",
  "Falafel",
  "Fondue",
  "Beef Stew",
  // Dairy / Eggs
  "Gruyere Cheese",
  "Scrambled Eggs",
  "Butter",
  "Oat Milk",
  // Sweets
  "Chocolate Lava Cake",
  "Doughnut",
  "Macaroon",
  "Custard Tart",
  "Pistachio Gelato",
  "Birthday Cake",
  "Cupcake",
  "Lollipop",
  "Honey",
  "Popcorn",
  // Drinks
  "Flat White",
  "Matcha Latte",
  "Bubble Tea",
  "Pina Colada",
  "Cabernet Sauvignon",
  "Bourbon Whiskey",
  "Sake",
  "Prosecco",
  "Craft IPA",
  "Yerba Mate",
  "Orange Juice",
  "Sriracha",
  // No match
  "Mystery Dish 9000",
];

console.log("╔══════════════════════════════════════════╗");
console.log("║   Food & Drink Emoji Matcher — Full Set  ║");
console.log("╚══════════════════════════════════════════╝\n");

for (const food of testCases) {
  const emoji = getFoodEmoji(food) ?? "❓";
  console.log(`${emoji}  ${food}`);
}

console.log("\n── annotateFoodString() ────────────────────");
const sentence =
  "Tonight I'm making chicken stir-fry with broccoli, garlic, and jasmine rice, " +
  "followed by a slice of cheesecake and a glass of prosecco.";
console.log("IN : ", sentence);
console.log("OUT:", annotateFoodString(sentence));
