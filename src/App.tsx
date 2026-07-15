import { useState } from "react";
import "./App.css";
import { useAppData } from "./hooks/useAppData";
import { useExchangeRates } from "./hooks/useExchangeRates";
import { Onboarding } from "./components/Onboarding";
import { Header } from "./components/Header";
import { QuickAddForm } from "./components/QuickAddForm";
import { CategoryChart } from "./components/CategoryChart";
import { CategoryList } from "./components/CategoryList";
import { CurrencyConverter } from "./components/CurrencyConverter";
import { exportDataAsJson, parseImportedJson } from "./lib/storage";

function App() {
  const {
    data,
    setSettings,
    addCategory,
    editCategory,
    addEntry,
    deleteEntry,
    deleteCategory,
    splitIntoSubcategories,
    replaceAll,
    resetAll,
  } = useAppData();
  const [importError, setImportError] = useState<string | null>(null);

  const displayCurrency = data.settings?.displayCurrency ?? "USD";
  const { rates } = useExchangeRates(displayCurrency);

  if (!data.settings) {
    return <Onboarding onDone={setSettings} />;
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
    try {
      const text = await file.text();
      const parsed = parseImportedJson(text);
      replaceAll(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Не удалось прочитать файл");
    }
  }

  return (
    <div className="app">
      <Header
        userName={data.settings.userName}
        displayCurrency={displayCurrency}
        onChangeCurrency={(code) => setSettings({ ...data.settings!, displayCurrency: code })}
        onExport={handleExport}
        onImport={handleImport}
        onReset={resetAll}
      />

      {importError && <p className="error-text">{importError}</p>}

      <div className="layout-grid">
        <div className="sidebar-col">
          <QuickAddForm
            categories={data.categories}
            displayCurrency={displayCurrency}
            onAddCategory={addCategory}
            onAddEntry={addEntry}
          />
          <CurrencyConverter defaultTo={displayCurrency} />
        </div>

        <div className="main-col">
          <CategoryChart
            categories={data.categories}
            entries={data.entries}
            displayCurrency={displayCurrency}
            rates={rates}
          />

          {data.categories.length > 0 && (
            <div className="stack">
              <div className="section-title">Категории</div>
              <CategoryList
                categories={data.categories}
                entries={data.entries}
                displayCurrency={displayCurrency}
                rates={rates}
                onDeleteEntry={deleteEntry}
                onDeleteCategory={deleteCategory}
                onAddCategory={addCategory}
                onEditCategory={editCategory}
                onSplitIntoSubcategories={splitIntoSubcategories}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
