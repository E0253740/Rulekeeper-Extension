import * as vscode from "vscode";

// Define the structure for your array items (tree items)
class ArrayItem extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.None); // None means no children
  }
}

export class ArrayDataProvider implements vscode.TreeDataProvider<ArrayItem> {
  // Your array data
  private array: string[];

  // Event to signal when data has changed
  private _onDidChangeTreeData: vscode.EventEmitter<ArrayItem | undefined> =
    new vscode.EventEmitter<ArrayItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ArrayItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(array: string[]) {
    this.array = array;
  }

  updateData(newArray: string[]): void {
    this.array = newArray; // Update the data
    this.refresh(); // Refresh the tree view
  }

  // Refresh the tree view
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  // Get the tree items (array elements) for the view
  getTreeItem(element: ArrayItem): vscode.TreeItem {
    return element;
  }

  // Get the array items as tree elements
  getChildren(element?: ArrayItem): Thenable<ArrayItem[]> {
    return Promise.resolve(this.array.map((item) => new ArrayItem(item)));
  }
}
