const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const topologicalSortButton = document.getElementById("topologicalSortButton");

let nodes = [];
let edges = [];
let draggingNode = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let selectedNode = null;
let number = 1;
const graph = new window.graphlib.Graph();

// 事件：右键点击节点或空白区域
canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault(); // 阻止默认右键菜单

    const x = event.offsetX;
    const y = event.offsetY;

    // 查找点击位置是否在某个节点上
    const node = findNodeAt(x, y);

    if (node) {
        if (!selectedNode) {
            // 如果没有选中的节点，设置当前点击的节点为起始节点
            selectedNode = node;
            console.log(`选中了起始节点：${node.content}`);
        } else if (selectedNode !== node) {
            // 如果已经选中了起始节点，再次点击另一个节点作为目标节点
            // 创建连线
            graph.setEdge(selectedNode.id, node.id);  // 使用 graphlib 创建有向边
            edges.push({ from: selectedNode, to: node }); // 将边添加到本地的 edges 数组

            // 输出连线信息
            console.log(`创建了从 ${selectedNode.content} 到 ${node.content} 的连线`);

            // 清空选中的起始节点，准备下一次连线操作
            selectedNode = null;

            render(); // 重新渲染图形
        }
    } else {
        console.log("点击空白区域,创建新的节点");

        // 添加新节点
        const nodeId = uuid.v4();  // 使用UUID来保证每个节点的唯一性
        const newNode = {
            id: nodeId,
            x: x,
            y: y,
            content: number
        };
        number++;
        nodes.push(newNode);
        graph.setNode(nodeId, { label: newNode.content }); // 确保图中添加新节点

        render();
    }
});

canvas.addEventListener("dblclick", (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    const node = findNodeAt(x, y);
    if (node) {
        const newContent = prompt("修改节点内容", node.content);
        if (newContent !== null) {
            node.content = newContent;
            graph.setNode(node.id, { label: newContent });
            render();
        }
    }
});

canvas.addEventListener("mousedown", (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const node = findNodeAt(x, y);

    if (node) {
        draggingNode = node;
        dragOffsetX = x - node.x;
        dragOffsetY = y - node.y;
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (draggingNode) {
        draggingNode.x = event.offsetX - dragOffsetX;
        draggingNode.y = event.offsetY - dragOffsetY;
        render();
    }
});

canvas.addEventListener("mouseup", () => {
    draggingNode = null;
});

// 查找指定位置的节点
function findNodeAt(x, y) {
    return nodes.find(node => {
        return Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2) < 25;
    });
}

// 渲染函数：绘制所有节点和边
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制所有节点
    nodes.forEach(node => {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = "#98D5F6";
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.font = "20px Arial"
        ctx.fillText(node.content, node.x - 10, node.y + 8);
    });

    // 绘制所有边
    edges.forEach(edge => {
        const fromNode = edge.from;
        const toNode = edge.to;

        // 绘制边
        ctx.lineWidth = 2;  // 设置线条的粗细为5px
        ctx.beginPath();
        ctx.moveTo(fromNode.x + 25, fromNode.y);
        ctx.lineTo(toNode.x - 25, toNode.y);
        ctx.stroke();

        // 计算箭头的角度
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x); // 计算边的方向

        // 箭头大小
        const arrowSize = 15;

        // 箭头的两个翅膀的角度（通常选择 30 度）
        const arrowAngle = Math.PI / 6; // 30度

        // 绘制箭头
        ctx.beginPath();
        ctx.moveTo(toNode.x - 25, toNode.y); // 箭头的尾部
        ctx.lineTo(toNode.x - 25 - arrowSize * Math.cos(angle - arrowAngle), toNode.y - arrowSize * Math.sin(angle - arrowAngle)); // 箭头左边
        ctx.moveTo(toNode.x - 25, toNode.y); // 箭头的尾部
        ctx.lineTo(toNode.x - 25 - arrowSize * Math.cos(angle + arrowAngle), toNode.y - arrowSize * Math.sin(angle + arrowAngle)); // 箭头右边
        ctx.stroke();
    });

}

// 拓扑排序事件
topologicalSortButton.addEventListener("click", () => {

    const sortedNodes = topologicalSort(graph);

    if (sortedNodes) {
        // 如果排序成功，弹窗显示拓扑排序结果，节点按一行输出
        alert("拓扑排序结果: " + sortedNodes.map(nodeId => {
            const node = nodes.find(n => n.id === nodeId);
            return node ? node.content : "Unknown Node";
        }).join(" -> ")); // 节点用 " -> " 连接，显示在一行
    } else {
        alert("图中存在环，无法进行拓扑排序！");
    }
});

// 拓扑排序算法实现：Kahn 算法
function topologicalSort(graph) {
    // 计算入度
    const inDegree = {};
    const sorted = [];
    const queue = [];

    graph.nodes().forEach(node => {
        inDegree[node] = graph.predecessors(node).length; // 获取入度
        console.log(`节点 ${node} -> 入度: ${inDegree[node]}`);
        if (inDegree[node] === 0) {
            queue.push(node);
        }
    });

    // 拓扑排序
    while (queue.length > 0) {
        const node = queue.shift();
        sorted.push(node);

        // 更新入度
        graph.neighbors(node).forEach(neighbor => {
            inDegree[neighbor]--;
            if (inDegree[neighbor] === 0) {
                queue.push(neighbor);
            }
        });
    }

    // 存在环
    if (sorted.length !== graph.nodeCount()) {
        return null;  // 无法进行拓扑排序
    }

    return sorted;
}