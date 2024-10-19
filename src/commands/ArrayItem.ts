import * as vscode from "vscode";

// Define the structure for your array items (tree items)
class ArrayItem extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.None); // None means no children
  }
}

export class ArrayDataProvider implements vscode.TreeDataProvider<ArrayItem> {
  private array: string[] = ["Element 1", "Element 2", "Element 3"]; // Your array data

  // Event to signal when data has changed
  private _onDidChangeTreeData: vscode.EventEmitter<ArrayItem | undefined> =
    new vscode.EventEmitter<ArrayItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ArrayItem | undefined> =
    this._onDidChangeTreeData.event;

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
