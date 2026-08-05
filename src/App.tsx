import { useState } from "react";
import "./App.css";
import { useAppData } from "./hooks/useAppData";
import { useExchangeRates } from "./hooks/useExchangeRates";
import { Onboarding } from "./components/Onboarding";
import { Header } from "./components/Header";
import { AccountPanel } from "./components/AccountPanel";
import { GroupManager } from "./components/GroupManager";
import { QuickAddForm } from "./components/QuickAddForm";
import { BudgetCard } from "./components/BudgetCard";
import { GoalsCard } from "./components/GoalsCard";
import { StatsCard } from "./components/StatsCard";
import { SpendingHeatmap } from "./components/SpendingHeatmap";
import { CategoryChart } from "./components/CategoryChart";
import { CategoryList } from "./components/CategoryList";
import { CurrencyConverter } from "./components/CurrencyConverter";
import { exportDataAsJson, parseImportedJson } from "./lib/storage";
import { parseBankCsv } from "./lib/csvImport";
import { useAuth } from "./hooks/useAuth";

function App() {
  const auth = useAuth();
  const {
    data,
    syncStatus,
    syncError,
    cloudUpdatedAt,
    setSettings,
    addGroup,
    editGroup,
    deleteGroup,
    addCategory,
    editCategory,
    toggleCategoryBanned,
    addEntry,
    addEntries,
    deleteEntry,
    updateEntry,
    deleteCategory,
    moveCategory,
    moveEntriesToCategory,
    splitIntoSubcategories,
    addGoal,
    deleteGoal,
    contributeToGoal,
    replaceAll,
    resetAll,
    syncNow,
  } = useAppData(auth.user?.id ?? null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const displayCurrency = data.settings?.displayCurrency ?? "USD";
  const { rates } = useExchangeRates(displayCurrency);

  const displayEntries =
    selectedGroupId === null
      ? data.entries
      : data.entries.filter((e) => e.groupId === selectedGroupId);

  if (!data.settings) {
    return (
      <Onboarding onDone={setSettings}>
        <AccountPanel
          auth={auth}
          syncStatus={syncStatus}
          syncError={syncError}
          cloudUpdatedAt={cloudUpdatedAt}
          onSyncNow={syncNow}
        />
      </Onboarding>
    );
  }

  function handleExport() {
    const blob = new Blob([exportDataAsJson(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visit-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    setImportError(null);
    setImportNotice(null);
    try {
      const text = await file.text();
      const parsed = parseImportedJson(text);
      replaceAll(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Не удалось прочитать файл");
    }
  }

  async function handleImportCsv(file: File) {
    setImportError(null);
    setImportNotice(null);
    try {
      const text = await file.text();
      const rows = parseBankCsv(text, displayCurrency);
      if (rows.length === 0) {
        setImportNotice("Не удалось распознать строки в CSV.");
        return;
      }

      const entriesToAdd = rows.map((row) => {
        const existing = data.categories.find(
          (c) => c.name.toLowerCase() === row.category.toLowerCase(),
        );
        const category = existing ?? addCategory(row.category);
        return {
          categoryId: category.id,
          groupId: null as string | null,
          name: row.name,
          amount: row.amount,
          currency: row.currency,
          createdAt: row.date,
        };
      });

      addEntries(entriesToAdd);
      setImportNotice(`Импортировано ${entriesToAdd.length} трат из CSV.`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Не удалось прочитать CSV");
    }
  }

  function handleDeleteGroup(id: string) {
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
    deleteGroup(id);
  }

  return (
    <div className="app">
      <Header
        userName={data.settings.userName}
        displayCurrency={displayCurrency}
        onChangeCurrency={(code) => setSettings({ ...data.settings!, displayCurrency: code })}
        onExport={handleExport}
        onImport={handleImport}
        onImportCsv={handleImportCsv}
        onReset={resetAll}
      />

      {importError && <p className="error-text">{importError}</p>}
      {importNotice && <p className="hint">{importNotice}</p>}

      <div className="layout-grid">
        <div className="sidebar-col">
          <AccountPanel
            auth={auth}
            syncStatus={syncStatus}
            syncError={syncError}
            cloudUpdatedAt={cloudUpdatedAt}
            onSyncNow={syncNow}
          />
          <GroupManager
            groups={data.groups}
            selectedGroupId={selectedGroupId}
            onSelect={setSelectedGroupId}
            onAdd={addGroup}
            onEdit={editGroup}
            onDelete={handleDeleteGroup}
          />
          <QuickAddForm
            categories={data.categories}
            groups={data.groups}
            selectedGroupId={selectedGroupId}
            displayCurrency={displayCurrency}
            onAddCategory={addCategory}
            onAddEntry={addEntry}
          />
          <BudgetCard
            settings={data.settings}
            entries={data.entries}
            rates={rates}
            onUpdateSettings={setSettings}
          />
          <GoalsCard
            goals={data.goals}
            onAdd={addGoal}
            onDelete={deleteGoal}
            onContribute={contributeToGoal}
          />
          <CurrencyConverter defaultTo={displayCurrency} />
          <StatsCard
            entries={data.entries}
            categories={data.categories}
            groups={data.groups}
            selectedGroupId={selectedGroupId}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>

        <div className="main-col">
          <CategoryChart
            categories={data.categories}
            entries={displayEntries}
            displayCurrency={displayCurrency}
            rates={rates}
          />

          <SpendingHeatmap entries={data.entries} displayCurrency={displayCurrency} rates={rates} />

          <div className="stack">
            <div className="section-title">Категории</div>
            <CategoryList
              categories={data.categories}
              entries={displayEntries}
              displayCurrency={displayCurrency}
              rates={rates}
              onDeleteEntry={deleteEntry}
              onUpdateEntry={updateEntry}
              onDeleteCategory={deleteCategory}
              onAddCategory={addCategory}
              onEditCategory={editCategory}
              onToggleBanned={toggleCategoryBanned}
              onSplitIntoSubcategories={splitIntoSubcategories}
              onMoveCategory={moveCategory}
              onMoveEntriesToCategory={moveEntriesToCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
