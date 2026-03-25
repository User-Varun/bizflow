import "../styles/searchBar.css";

export function SearchBar({ widthInPercent, searchQuery, setSearchQuery }) {
  return (
    <div
      id="searchBarContainer"
      style={{ width: `${widthInPercent ? widthInPercent : 100}%` }}
    >
      <input
        type="text"
        id="inputEl"
        placeholder="Search Products"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <a className="searchBtn">🔍</a>
    </div>
  );
}
