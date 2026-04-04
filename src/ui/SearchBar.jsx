import "../styles/searchBar.css";

export function SearchBar({
  widthInPercent,
  searchQuery,
  setSearchQuery,
  placeholder = "Search Products",
}) {
  return (
    <div
      id="searchBarContainer"
      style={{ width: `${widthInPercent ? widthInPercent : 100}%` }}
    >
      <input
        type="text"
        id="inputEl"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <a className="searchBtn">🔍</a>
    </div>
  );
}
