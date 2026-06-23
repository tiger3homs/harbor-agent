declare module 'better-sqlite3' {
  interface Database {
    prepare: (sql: string) => any;
    exec: (sql: string) => void;
    close: () => void;
  }
  const Database: {
    new (path: string): Database;
  };
  export = Database;
}