import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowRight, Check, CircleHelp, Clock3, Leaf, ListChecks, Menu, Plus, Search, ShoppingBasket, Sparkles, X } from 'lucide-react';
import { createContext as makeContext, useContext as useCtx } from 'react';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
type Ingredient = { name: string; quantity: string };
type Recipe = { id: string; name: string; description: string; mealType: MealType; prepMinutes: number; servings: number; tags: string[]; ingredients: Ingredient[]; instructions: string[]; image: string };
type MealSlot = { day: string; mealType: MealType; recipeId: string | null };
type GroceryItem = { id: string; name: string; quantity: string; category: string; checked: boolean };
type AppData = { slots: MealSlot[]; groceries: GroceryItem[] };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];
const recipes: Recipe[] = [
  { id: 'oats', name: 'Pear & toasted oat bowl', description: 'Creamy oats, warm pear and a little crunch for a gentle start.', mealType: 'Breakfast', prepMinutes: 12, servings: 2, tags: ['Quick', 'Vegetarian'], ingredients: [{ name: 'Rolled oats', quantity: '1 cup' }, { name: 'Ripe pear', quantity: '1' }, { name: 'Milk of choice', quantity: '1½ cups' }, { name: 'Pumpkin seeds', quantity: '2 tbsp' }], instructions: ['Simmer oats with milk until creamy.', 'Slice the pear and soften it in a pan for a few minutes.', 'Spoon into bowls and finish with seeds.'], image: 'oat' },
  { id: 'eggs', name: 'Herby eggs on toast', description: 'Soft scrambled eggs with greens and lemony herbs.', mealType: 'Breakfast', prepMinutes: 15, servings: 2, tags: ['High protein', 'Quick'], ingredients: [{ name: 'Eggs', quantity: '4' }, { name: 'Sourdough', quantity: '2 slices' }, { name: 'Baby spinach', quantity: '2 handfuls' }, { name: 'Fresh parsley', quantity: '¼ bunch' }], instructions: ['Toast the sourdough.', 'Wilt spinach in a pan, then gently scramble the eggs.', 'Pile onto toast with chopped parsley and black pepper.'], image: 'greens' },
  { id: 'yogurt', name: 'Citrus yogurt & granola', description: 'Bright citrus, thick yogurt and a handful of crunchy granola.', mealType: 'Breakfast', prepMinutes: 8, servings: 2, tags: ['No cook', 'Quick'], ingredients: [{ name: 'Greek yogurt', quantity: '1½ cups' }, { name: 'Orange', quantity: '1' }, { name: 'Granola', quantity: '½ cup' }, { name: 'Honey', quantity: '1 tbsp' }], instructions: ['Divide yogurt between bowls.', 'Add orange segments and granola.', 'Drizzle with honey.'], image: 'citrus' },
  { id: 'salad', name: 'Chickpea crunch salad', description: 'Crisp cucumber, lemony chickpeas and a generous shower of herbs.', mealType: 'Lunch', prepMinutes: 20, servings: 2, tags: ['Vegetarian', 'Meal prep'], ingredients: [{ name: 'Chickpeas', quantity: '1 can' }, { name: 'Cucumber', quantity: '½' }, { name: 'Cherry tomatoes', quantity: '1 cup' }, { name: 'Lemon', quantity: '1' }, { name: 'Feta', quantity: '⅓ cup' }], instructions: ['Rinse and drain the chickpeas.', 'Chop cucumber and tomatoes; toss with lemon juice and olive oil.', 'Fold in feta and herbs just before serving.'], image: 'salad' },
  { id: 'soup', name: 'Roasted tomato & white bean soup', description: 'A cozy, pantry-friendly bowl with roasted tomatoes and creamy beans.', mealType: 'Lunch', prepMinutes: 35, servings: 4, tags: ['Vegetarian', 'Batch cook'], ingredients: [{ name: 'Tomatoes', quantity: '1½ lb' }, { name: 'Cannellini beans', quantity: '1 can' }, { name: 'Vegetable stock', quantity: '3 cups' }, { name: 'Garlic', quantity: '3 cloves' }], instructions: ['Roast tomatoes and garlic until soft and caramelized.', 'Warm beans with stock in a pot.', 'Blend in the roasted tomatoes and serve with toast.'], image: 'tomato' },
  { id: 'wrap', name: 'Green goddess lunch wraps', description: 'A fresh, packable wrap with crunchy vegetables and a quick herby sauce.', mealType: 'Lunch', prepMinutes: 18, servings: 2, tags: ['Vegetarian', 'Quick'], ingredients: [{ name: 'Tortillas', quantity: '2 large' }, { name: 'Avocado', quantity: '1' }, { name: 'Lettuce', quantity: '1 small head' }, { name: 'Greek yogurt', quantity: '¼ cup' }], instructions: ['Mash avocado with lemon and a pinch of salt.', 'Stir herbs into yogurt for a quick sauce.', 'Layer on tortillas, roll tightly and slice in half.'], image: 'greens' },
  { id: 'salmon', name: 'Crispy salmon rice plate', description: 'Flaky salmon, warm rice and quick-pickled cucumber in one colorful plate.', mealType: 'Dinner', prepMinutes: 30, servings: 2, tags: ['High protein', 'Weeknight'], ingredients: [{ name: 'Salmon fillets', quantity: '2' }, { name: 'Brown rice', quantity: '1 cup' }, { name: 'Cucumber', quantity: '1' }, { name: 'Rice vinegar', quantity: '2 tbsp' }], instructions: ['Cook rice according to the package.', 'Sear salmon until crisp outside and just cooked through.', 'Toss cucumber with vinegar and serve alongside.'], image: 'salmon' },
  { id: 'pasta', name: 'Lemony greens pasta', description: 'A weeknight pasta with leafy greens, parmesan and a bright lemon finish.', mealType: 'Dinner', prepMinutes: 25, servings: 3, tags: ['Vegetarian', 'Quick'], ingredients: [{ name: 'Pasta', quantity: '10 oz' }, { name: 'Kale', quantity: '1 bunch' }, { name: 'Lemon', quantity: '1' }, { name: 'Parmesan', quantity: '⅓ cup' }], instructions: ['Cook pasta, saving a mug of the cooking water.', 'Sauté chopped kale with olive oil until tender.', 'Toss with pasta, lemon zest, juice and parmesan.'], image: 'pasta' },
  { id: 'tacos', name: 'Smoky sweet potato tacos', description: 'Roasted sweet potato, black beans and tangy slaw tucked into warm tortillas.', mealType: 'Dinner', prepMinutes: 35, servings: 4, tags: ['Vegetarian', 'Batch cook'], ingredients: [{ name: 'Sweet potatoes', quantity: '2 medium' }, { name: 'Black beans', quantity: '1 can' }, { name: 'Corn tortillas', quantity: '8' }, { name: 'Red cabbage', quantity: '2 cups' }], instructions: ['Roast diced sweet potatoes with smoked paprika.', 'Warm black beans and season with lime.', 'Pile into tortillas with crunchy cabbage.'], image: 'tacos' },
  { id: 'traybake', name: 'Golden tray-bake chicken', description: 'One-pan chicken and seasonal vegetables with a fragrant lemon dressing.', mealType: 'Dinner', prepMinutes: 40, servings: 4, tags: ['High protein', 'One pan'], ingredients: [{ name: 'Chicken thighs', quantity: '4' }, { name: 'Baby potatoes', quantity: '1 lb' }, { name: 'Green beans', quantity: '8 oz' }, { name: 'Lemon', quantity: '1' }], instructions: ['Arrange chicken and potatoes on a sheet pan with oil and herbs.', 'Roast until golden and cooked through.', 'Add green beans for the final 10 minutes and finish with lemon.'], image: 'gold' },
  { id: 'pancakes', name: 'Banana oat pancakes', description: 'A short stack made with ripe banana and pantry oats.', mealType: 'Breakfast', prepMinutes: 20, servings: 2, tags: ['Vegetarian', 'Weekend'], ingredients: [{ name: 'Banana', quantity: '1 ripe' }, { name: 'Eggs', quantity: '2' }, { name: 'Rolled oats', quantity: '¾ cup' }, { name: 'Yogurt', quantity: '½ cup' }], instructions: ['Blend banana, eggs and oats into a batter.', 'Cook small pancakes in a lightly oiled skillet.', 'Serve warm with yogurt and fruit.'], image: 'gold' },
  { id: 'noodles', name: 'Sesame ginger noodle bowl', description: 'Springy noodles, crunchy vegetables and a savory sesame-ginger dressing.', mealType: 'Lunch', prepMinutes: 22, servings: 2, tags: ['Quick', 'Vegetarian'], ingredients: [{ name: 'Noodles', quantity: '6 oz' }, { name: 'Carrots', quantity: '2' }, { name: 'Edamame', quantity: '1 cup' }, { name: 'Sesame oil', quantity: '1 tbsp' }], instructions: ['Cook noodles and rinse briefly under cool water.', 'Whisk sesame oil with soy, ginger and lime.', 'Toss noodles with vegetables and dressing.'], image: 'salad' },
];
const originalSlots: MealSlot[] = DAYS.flatMap((day, i) => MEALS.map((mealType, m) => ({ day, mealType, recipeId: [[ 'oats', 'salad', 'salmon' ], [ 'eggs', 'soup', 'pasta' ], [ 'yogurt', 'wrap', 'tacos' ], [ 'oats', 'noodles', 'traybake' ], [ 'eggs', 'salad', 'pasta' ], [ 'pancakes', 'soup', 'salmon' ], [ 'yogurt', 'wrap', 'tacos' ]][i][m] })));
const starterGroceries: GroceryItem[] = [
  { id: 'g1', name: 'Rolled oats', quantity: '1 cup', category: 'Pantry', checked: false }, { id: 'g2', name: 'Ripe pear', quantity: '1', category: 'Produce', checked: false },
  { id: 'g3', name: 'Chickpeas', quantity: '1 can', category: 'Pantry', checked: false }, { id: 'g4', name: 'Cucumber', quantity: '2', category: 'Produce', checked: false },
  { id: 'g5', name: 'Salmon fillets', quantity: '2', category: 'Protein', checked: false }, { id: 'g6', name: 'Brown rice', quantity: '1 cup', category: 'Pantry', checked: false },
  { id: 'g7', name: 'Greek yogurt', quantity: '1 tub', category: 'Dairy & chilled', checked: true },
];
const Store = makeContext<{
  slots: MealSlot[]; setSlots: (v: MealSlot[]) => void; groceries: GroceryItem[]; setGroceries: (v: GroceryItem[]) => void;
  selected: Recipe | null; setSelected: (r: Recipe | null) => void; addRecipe: (r: Recipe, day?: string) => void;
} | null>(null);
const useStore = () => { const value = useCtx(Store); if (!value) throw new Error('Store not available'); return value; };
const queryClient = new QueryClient();

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { groceries } = useStore();
  const nav = [{ href: '/', label: 'Today', icon: Sparkles }, { href: '/meal-plan', label: 'Meal plan', icon: ListChecks }, { href: '/recipes', label: 'Recipes', icon: Leaf }, { href: '/grocery-list', label: 'Grocery list', icon: ShoppingBasket }];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark"><span /></span><span>daily<span className="brand-light">plate</span><small>MAKE ROOM FOR GOOD</small></span></Link>
      <div className="side-label">YOUR SPACE</div>
      <nav className="side-nav">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Grocery list' && <i className="nav-count">{groceries.filter(x => !x.checked).length}</i>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-sprig"><Leaf size={17} /></span><p>A little planning goes a long way.</p><span>Take it one meal at a time.</span></div><div className="sidebar-foot">A softer way to plan your week</div></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} data-testid="button-close-navigation" />}
    <main className="main-shell">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation" data-testid="button-mobile-menu">{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button><div className="crumb">A GOOD DAY STARTS HERE <span>·</span> <strong>{nav.find(n => n.href === location)?.label || 'Daily Plate'}</strong></div><div className="top-date"><span className="date-dot" /> YOUR WEEK, YOUR WAY</div></header>
      <div className="page-area">{children}</div>
      <footer className="disclaimer"><CircleHelp size={15} /><span>Daily Plate is general information for everyday meal planning, not personalized medical advice.</span></footer>
    </main>
    <RecipeModal />
  </div>;
}

function RecipeModal() {
  const { selected, setSelected, addRecipe } = useStore();
  const [day, setDay] = useState('Monday');
  if (!selected) return null;
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }} data-testid="modal-recipe">
    <section className="recipe-modal">
      <button className="icon-button modal-close" onClick={() => setSelected(null)} aria-label="Close recipe details" data-testid="button-close-recipe"><X size={19} /></button>
      <FoodArt recipe={selected} large />
      <div className="modal-content"><div className="eyebrow">{selected.mealType} <span>·</span> {selected.tags.join(' / ')}</div><h2 className="serif">{selected.name}</h2><p className="modal-desc">{selected.description}</p>
        <div className="recipe-facts"><span><Clock3 size={15} /> {selected.prepMinutes} min</span><span>{selected.servings} servings</span></div>
        <div className="recipe-two-col"><div><h3>What you'll need</h3><ul className="ingredient-list">{selected.ingredients.map(i => <li key={i.name}><span>{i.name}</span><b>{i.quantity}</b></li>)}</ul></div><div><h3>Let's make it</h3><ol className="instructions">{selected.instructions.map((step, i) => <li key={step}><span>{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol></div></div>
        <div className="modal-add"><label htmlFor="plan-day">Add to your plan</label><select id="plan-day" value={day} onChange={e => setDay(e.target.value)} data-testid="select-recipe-day">{DAYS.map(d => <option key={d}>{d}</option>)}</select><button className="btn-primary" onClick={() => { addRecipe(selected, day); setSelected(null); }} data-testid="button-add-recipe-to-plan"><Plus size={16} /> Add to {day}</button></div>
      </div>
    </section>
  </div>;
}

function FoodArt({ recipe, large = false }: { recipe: Recipe; large?: boolean }) {
  const palette: Record<string, string[]> = { oat: ['#d8b882', '#f0ddb0'], greens: ['#819a69', '#d3c991'], citrus: ['#df9d52', '#f0d792'], salad: ['#94a36c', '#e2c77f'], tomato: ['#bf6754', '#e3a77e'], salmon: ['#d18461', '#efc891'], pasta: ['#c7b76d', '#e7d89d'], tacos: ['#c8894d', '#e7c279'], gold: ['#c99455', '#e8d29b'] };
  const [a, b] = palette[recipe.image] || palette.gold;
  return <div className={`food-art ${large ? 'food-art-large' : ''}`} style={{ '--art-a': a, '--art-b': b } as React.CSSProperties} aria-label={`Illustration for ${recipe.name}`} role="img"><span className="art-caption">{recipe.mealType.toUpperCase()}</span></div>;
}

function TodayPage() {
  const { slots, groceries, setSelected } = useStore();
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const todaySlots = slots.filter(s => s.day === today);
  const planned = todaySlots.filter(s => s.recipeId).length;
  const getRecipe = (id: string | null) => recipes.find(r => r.id === id);
  return <div className="page-enter">
    <section className="welcome-row"><div><div className="eyebrow">A FRESH PAGE, EVERY DAY</div><h1 className="serif">Today, made <em>simple.</em></h1><p className="subhead">A little idea for each meal. Plenty of room to make it your own.</p></div><Link href="/meal-plan" className="text-link" data-testid="link-view-week-plan">See your week <ArrowRight size={16} /></Link></section>
    <section className="today-hero"><div className="hero-copy"><div className="hero-kicker"><span className="sun-mark">✳</span> {new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</div><h2 className="serif">Good things<br />are on the table.</h2><p>Your plan is a starting point, not a set of rules. Swap things around whenever you like.</p><Link href="/meal-plan" className="hero-button" data-testid="link-edit-today-plan">Tend to your week <ArrowRight size={16} /></Link></div>
      <div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><span className="hero-seed seed-one" /><span className="hero-seed seed-two" /><div className="plate-art"><div /><span className="plate-leaf leaf-one" /><span className="plate-leaf leaf-two" /><span className="plate-tomato" /></div><div className="hero-sticker">made<br />with care</div></div>
    </section>
    <section className="section-head"><div><div className="eyebrow">YOUR PLATE FOR TODAY</div><h2 className="serif">{today} at a glance</h2></div><span className="small-counter">{planned} of 3 planned</span></section>
    <section className="today-meals">{todaySlots.map(slot => { const recipe = getRecipe(slot.recipeId); return <article className={`today-meal ${recipe ? '' : 'meal-empty'}`} key={slot.mealType} data-testid={`card-today-${slot.mealType.toLowerCase()}`}><div className="meal-time">{slot.mealType}<span>{recipe ? `${recipe.prepMinutes} MIN` : 'OPEN SLOT'}</span></div>{recipe ? <><button className="meal-thumb" onClick={() => setSelected(recipe)} aria-label={`View ${recipe.name}`} data-testid={`button-open-${recipe.id}`}><FoodArt recipe={recipe} /></button><div className="today-meal-info"><h3>{recipe.name}</h3><p>{recipe.description}</p><button className="mini-link" onClick={() => setSelected(recipe)} data-testid={`button-view-${recipe.id}`}>See recipe <ArrowRight size={14} /></button></div></> : <div className="empty-meal-copy"><span>Something good goes here.</span><Link href="/recipes" className="mini-link" data-testid="link-find-meal">Find a meal <ArrowRight size={14} /></Link></div>}</article>; })}</section>
    <section className="bottom-panels"><article className="week-peek"><div className="panel-head"><div><div className="eyebrow">THE BIG PICTURE</div><h3 className="serif">This week, gently.</h3></div><Link href="/meal-plan" className="mini-link" data-testid="link-week-plan">Open plan <ArrowRight size={14} /></Link></div><div className="week-dots">{DAYS.map(d => { const count = slots.filter(s => s.day === d && s.recipeId).length; return <div key={d} className={`week-day ${d === today ? 'current' : ''}`}><span>{d.slice(0, 1)}</span><div>{[0, 1, 2].map(n => <i key={n} className={n < count ? 'filled' : ''} />)}</div></div>; })}</div><p className="muted-copy">Little plans leave space for real life.</p></article>
      <article className="grocery-peek"><div className="panel-head"><div><div className="eyebrow">READY WHEN YOU ARE</div><h3 className="serif">On the list</h3></div><Link href="/grocery-list" className="round-link" aria-label="Open grocery list" data-testid="link-open-groceries"><ArrowRight size={17} /></Link></div><div className="grocery-peek-items">{groceries.filter(g => !g.checked).slice(0, 3).map(g => <div key={g.id}><span className="tiny-check" />{g.name}<small>{g.quantity}</small></div>)}{groceries.filter(g => !g.checked).length === 0 && <p className="muted-copy">Your list is clear. Nice.</p>}</div><Link href="/grocery-list" className="list-foot-link" data-testid="link-grocery-list">{groceries.filter(g => !g.checked).length} things to pick up <ArrowRight size={14} /></Link></article></section>
    <div className="soft-note"><Sparkles size={16} /><span>Meal planning should make life easier, not smaller. Keep what works; leave the rest.</span></div>
  </div>;
}

function MealPlanPage() {
  const { slots, setSlots, setSelected } = useStore();
  const [view, setView] = useState<'week' | 'list'>('week');
  const setSlot = (day: string, mealType: MealType, recipeId: string | null) => setSlots(slots.map(s => s.day === day && s.mealType === mealType ? { ...s, recipeId } : s));
  return <div className="page-enter"><div className="page-heading-row"><div><div className="eyebrow">MAKE A LITTLE SPACE</div><h1 className="serif">Your week, <em>at a glance.</em></h1><p className="subhead">A flexible plan for the meals ahead. Change anything, anytime.</p></div><div className="view-toggle"><button className={view === 'week' ? 'selected' : ''} onClick={() => setView('week')} data-testid="button-week-view">Week</button><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} data-testid="button-list-view">List</button></div></div>
    <div className="plan-toolbar"><span><span className="tiny-dot" /> {slots.filter(s => s.recipeId).length} meals planned</span><Link href="/recipes" className="btn-soft" data-testid="link-find-recipes"><Plus size={16} /> Find a recipe</Link></div>
    {view === 'week' ? <div className="plan-grid-wrap"><div className="plan-grid"><div className="plan-corner" /><div className="plan-meal-label"><span>BREAKFAST</span></div><div className="plan-meal-label"><span>LUNCH</span></div><div className="plan-meal-label"><span>DINNER</span></div>
      {DAYS.map(day => <div className="plan-row" key={day}><div className="plan-day-name"><b>{day.slice(0, 3)}</b><span>{day}</span></div>{MEALS.map(meal => { const slot = slots.find(s => s.day === day && s.mealType === meal); const recipe = recipes.find(r => r.id === slot?.recipeId); return <div className="plan-cell" key={meal}>{recipe ? <div className="plan-card"><button className="plan-card-main" onClick={() => setSelected(recipe)} data-testid={`button-plan-recipe-${day.toLowerCase()}-${meal.toLowerCase()}`}><FoodArt recipe={recipe} /><span>{recipe.name}</span><small><Clock3 size={12} /> {recipe.prepMinutes} min</small></button><select value={recipe.id} onChange={e => setSlot(day, meal, e.target.value || null)} aria-label={`Change ${meal} for ${day}`} data-testid={`select-plan-${day.toLowerCase()}-${meal.toLowerCase()}`}><option value="">Leave open</option>{recipes.filter(r => r.mealType === meal).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div> : <button className="slot-empty" onClick={() => setSlot(day, meal, recipes.find(r => r.mealType === meal)?.id || null)} data-testid={`button-fill-${day.toLowerCase()}-${meal.toLowerCase()}`}><Plus size={17} /><span>Add an idea</span></button>}</div>; })}</div>)}
    </div></div> : <div className="plan-list-view">{DAYS.map(day => <section className="list-day" key={day}><h2>{day}</h2>{MEALS.map(meal => { const slot = slots.find(s => s.day === day && s.mealType === meal); const recipe = recipes.find(r => r.id === slot?.recipeId); return <div key={meal} className="list-slot"><span>{meal}</span>{recipe ? <><button onClick={() => setSelected(recipe)} data-testid={`button-list-recipe-${recipe.id}`}>{recipe.name}</button><select value={recipe.id} onChange={e => setSlot(day, meal, e.target.value || null)} data-testid={`select-list-${day}-${meal}`}><option value="">Leave open</option>{recipes.filter(r => r.mealType === meal).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></> : <button className="mini-link" onClick={() => setSlot(day, meal, recipes.find(r => r.mealType === meal)?.id || null)} data-testid={`button-list-add-${day}-${meal}`}>Add an idea <Plus size={14} /></button>}</div>; })}</section>)}</div>}
    <div className="plan-tip"><Sparkles size={17} /><span><b>Keep it flexible.</b> An open slot is a perfectly good plan, too.</span></div>
  </div>;
}

function RecipesPage() {
  const { setSelected } = useStore();
  const [query, setQuery] = useState('');
  const [mealFilter, setMealFilter] = useState('All meals');
  const [tagFilter, setTagFilter] = useState('All styles');
  const filters = ['All styles', 'Quick', 'Vegetarian', 'High protein', 'Batch cook'];
  const filtered = useMemo(() => recipes.filter(r => (mealFilter === 'All meals' || r.mealType === mealFilter) && (tagFilter === 'All styles' || r.tags.includes(tagFilter)) && `${r.name} ${r.description} ${r.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query, mealFilter, tagFilter]);
  return <div className="page-enter"><div className="eyebrow">A FEW GOOD IDEAS</div><div className="page-heading-row recipes-heading"><div><h1 className="serif">Find your next <em>favorite.</em></h1><p className="subhead">Practical, flexible recipes for the real shape of your week.</p></div><div className="recipe-count"><span>{filtered.length.toString().padStart(2, '0')}</span><small>GOOD IDEAS</small></div></div>
    <div className="recipe-controls"><label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search meals, ingredients..." aria-label="Search recipes" data-testid="input-search-recipes" />{query && <button onClick={() => setQuery('')} aria-label="Clear search" data-testid="button-clear-search"><X size={16} /></button>}</label><select className="filter-select" value={mealFilter} onChange={e => setMealFilter(e.target.value)} aria-label="Filter by meal" data-testid="select-meal-filter">{['All meals', ...MEALS].map(f => <option key={f}>{f}</option>)}</select></div>
    <div className="filter-chips">{filters.map(f => <button key={f} className={tagFilter === f ? 'active' : ''} onClick={() => setTagFilter(f)} data-testid={`button-filter-${f.toLowerCase().replace(' ', '-')}`}>{f}</button>)}</div>
    {filtered.length ? <div className="recipes-grid">{filtered.map((recipe, i) => <article className="recipe-card" key={recipe.id} style={{ animationDelay: `${i * 35}ms` }} data-testid={`card-recipe-${recipe.id}`}><button className="recipe-cover" onClick={() => setSelected(recipe)} aria-label={`Open ${recipe.name}`} data-testid={`button-recipe-detail-${recipe.id}`}><FoodArt recipe={recipe} /><span className="cover-time"><Clock3 size={13} /> {recipe.prepMinutes} MIN</span><span className="cover-arrow"><ArrowRight size={16} /></span></button><div className="recipe-card-content"><div className="recipe-card-meta"><span>{recipe.mealType}</span><span>·</span><span>{recipe.tags[0]}</span></div><button className="recipe-title serif" onClick={() => setSelected(recipe)} data-testid={`button-recipe-title-${recipe.id}`}>{recipe.name}</button><p>{recipe.description}</p><div className="recipe-card-footer"><span>For {recipe.servings}</span><button onClick={() => setSelected(recipe)} className="mini-link" data-testid={`button-view-recipe-${recipe.id}`}>Take a look <ArrowRight size={14} /></button></div></div></article>)}</div> : <div className="empty-state"><div className="empty-illustration"><Search size={26} /></div><h2 className="serif">Nothing on this plate.</h2><p>Try a different search or clear a filter to see more recipes.</p><button className="btn-soft" onClick={() => { setQuery(''); setMealFilter('All meals'); setTagFilter('All styles'); }} data-testid="button-reset-filters">Clear the filters</button></div>}
  </div>;
}

function GroceryPage() {
  const { groceries, setGroceries, slots } = useStore();
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [adding, setAdding] = useState(false);
  const toggle = (id: string) => setGroceries(groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  const add = (e: React.FormEvent) => { e.preventDefault(); if (!newName.trim()) return; setGroceries([...groceries, { id: crypto.randomUUID(), name: newName.trim(), quantity: newQty.trim() || '1', category: categoryFor(newName), checked: false }]); setNewName(''); setNewQty(''); setAdding(false); };
  const edit = (item: GroceryItem) => { const name = window.prompt('Edit item name', item.name); if (name === null || !name.trim()) return; const quantity = window.prompt('Edit quantity', item.quantity); if (quantity === null) return; setGroceries(groceries.map(g => g.id === item.id ? { ...g, name: name.trim(), quantity: quantity.trim() } : g)); };
  const remove = (id: string) => setGroceries(groceries.filter(g => g.id !== id));
  const categories = ['Produce', 'Protein', 'Dairy & chilled', 'Pantry', 'Bakery', 'Other'];
  const checked = groceries.filter(g => g.checked).length;
  const plannedCount = slots.filter(s => s.recipeId).length;
  return <div className="page-enter"><div className="eyebrow">THE LITTLE THINGS TO PICK UP</div><div className="page-heading-row grocery-heading"><div><h1 className="serif">A list that <em>lightens the load.</em></h1><p className="subhead">A running list for your next trip. Add, edit, check things off.</p></div><div className="grocery-progress"><div className="progress-ring">{groceries.length ? Math.round(checked / groceries.length * 100) : 0}<small>%</small></div><span>{checked} of {groceries.length}<small> gathered</small></span></div></div>
    <div className="grocery-toolbar"><div className="grocery-note"><ShoppingBasket size={18} /><span>Built around your week, and ready for your edits.</span></div><button className="btn-primary" onClick={() => setAdding(!adding)} data-testid="button-add-grocery"><Plus size={16} /> Add an item</button></div>
    {adding && <form className="add-item-form" onSubmit={add} data-testid="form-add-grocery"><label><span>Item</span><input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. lemons" data-testid="input-grocery-name" /></label><label><span>Quantity</span><input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="e.g. 2" data-testid="input-grocery-quantity" /></label><button type="submit" className="btn-primary" data-testid="button-save-grocery">Add to list</button><button type="button" className="icon-button" onClick={() => setAdding(false)} aria-label="Cancel adding" data-testid="button-cancel-grocery"><X size={17} /></button></form>}
    <div className="grocery-layout"><div className="grocery-list-main">{categories.map(category => { const items = groceries.filter(g => g.category === category); if (!items.length) return null; return <section className="grocery-category" key={category}><div className="category-heading"><h2>{category}</h2><span>{items.length.toString().padStart(2, '0')}</span></div>{items.map(item => <div className={`grocery-row ${item.checked ? 'checked' : ''}`} key={item.id} data-testid={`row-grocery-${item.id}`}><button className="check-button" onClick={() => toggle(item.id)} aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.name}`} data-testid={`button-check-${item.id}`}>{item.checked && <Check size={14} />}</button><span className="grocery-name">{item.name}</span><span className="grocery-qty">{item.quantity}</span><button className="edit-item" onClick={() => edit(item)} aria-label={`Edit ${item.name}`} data-testid={`button-edit-${item.id}`}>Edit</button><button className="remove-item" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`} data-testid={`button-remove-${item.id}`}><X size={15} /></button></div>)}</section>})}
        {groceries.length === 0 && <div className="empty-state"><div className="empty-illustration"><ShoppingBasket size={27} /></div><h2 className="serif">Your list can start small.</h2><p>Add a few things for the week ahead.</p><button className="btn-primary" onClick={() => setAdding(true)} data-testid="button-start-grocery-list"><Plus size={16} /> Add an item</button></div>}</div>
      <aside className="grocery-aside"><div className="aside-art"><span className="aside-leaf">✳</span><div className="basket-art"><span /><span /><span /><i /></div></div><div className="aside-copy"><div className="eyebrow">A NOTE TO SELF</div><h3 className="serif">Good enough<br />is good.</h3><p>Shop for the meals you have planned. Leave a little room for what looks lovely at the market.</p></div><div className="list-summary"><div><span>Meals on your plan</span><b>{plannedCount}</b></div><div><span>Still to find</span><b>{groceries.length - checked}</b></div><Link href="/meal-plan" className="mini-link" data-testid="link-from-grocery-to-plan">Take a look at your plan <ArrowRight size={14} /></Link></div></aside></div>
  </div>;
}
function categoryFor(name: string) { const lower = name.toLowerCase(); if (/milk|yogurt|cheese|butter|cream|feta/.test(lower)) return 'Dairy & chilled'; if (/chicken|fish|salmon|egg|tofu|beef/.test(lower)) return 'Protein'; if (/bread|tortilla|sourdough/.test(lower)) return 'Bakery'; if (/rice|oat|bean|pasta|oil|flour|seed|noodle/.test(lower)) return 'Pantry'; if (/pear|apple|tomato|lemon|cucumber|spinach|kale|greens|potato|orange|carrot/.test(lower)) return 'Produce'; return 'Other'; }

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
  const [saved, setSaved] = useState(false);
  const [slots, setSlots] = useState<MealSlot[]>(originalSlots);
  const [groceries, setGroceries] = useState<GroceryItem[]>(starterGroceries);
  const [selected, setSelected] = useState<Recipe | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem('daily-plate-v1'); if (raw) { const data = JSON.parse(raw) as AppData; if (Array.isArray(data.slots)) setSlots(data.slots); if (Array.isArray(data.groceries)) setGroceries(data.groceries); } } catch { /* keep the starter plan */ } setSaved(true); }, []);
  useEffect(() => { if (saved) localStorage.setItem('daily-plate-v1', JSON.stringify({ slots, groceries })); }, [slots, groceries, saved]);
  const addRecipe = (recipe: Recipe, day = 'Monday') => setSlots(prev => { const existing = prev.find(s => s.day === day && s.mealType === recipe.mealType); return existing ? prev.map(s => s === existing ? { ...s, recipeId: recipe.id } : s) : [...prev, { day, mealType: recipe.mealType, recipeId: recipe.id }]; });
  const store = { slots, setSlots, groceries, setGroceries, selected, setSelected, addRecipe };
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Store.Provider value={store}><RoutedErrorBoundary><Shell><Switch><Route path="/" component={TodayPage} /><Route path="/meal-plan" component={MealPlanPage} /><Route path="/recipes" component={RecipesPage} /><Route path="/grocery-list" component={GroceryPage} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary></Store.Provider></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
