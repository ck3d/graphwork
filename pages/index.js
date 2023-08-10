import Head from 'next/head'
import * as d3 from "d3"
import { useEffect, useState } from 'react'
const Graph = require('graphology')
const gexf = require('graphology-gexf')

export default function Home() {

  let [graphState, setGraphState] = useState(new Graph())
  let [selectedNode, setSelectedNode] = useState(null)
  let [hoveredNode, setHoveredNode] = useState(null)

  let zoomable = d3.zoom()

  useEffect(() => {
    // Copyright 2021 Observable, Inc.
    // Released under the ISC license.
    // https://observablehq.com/@d3/force-directed-graph
    function ForceGraph(graph) {
      // Specify the dimensions of the chart.
      const width = 928;
      const height = 600;

      // Specify the color scale.
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const maxClosureSize = graph.reduceNodes((prev, _n, a) => Math.max(prev, a.closureSize), 0)
      const maxNarSize = graph.reduceNodes((prev, _n, a) => Math.max(prev, a.narSize), 0)

      // The force simulation mutates links and nodes, so create a copy
      // so that re-evaluating this cell produces the same result.
      const links = graph.export().edges.map(d => ({ ...d }));
      const nodes = graph.export().nodes.map(d => ({ id: d.key, ...d }));

      // Create a simulation with several forces.
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

      // Create the SVG container.
      const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

      // Add a line for each link, and a circle for each node.
      const link = svg.append("g")
        .attr("stroke", "#ccc")
        .selectAll()
        .data(links)
        .join("line")
        .attr("stroke-width", 1);

      const node = svg.append("g")
        .attr("stroke-width", 1.5)
        .selectAll()
        .data(nodes)
        .join("circle")
        .attr("id", (d) => d.id)
        .attr("r", (d) => Math.max(d.attributes.narSize / maxNarSize, 0.1) * 5)
        .attr("opacity", (d) => Math.max(d.attributes.closureSize / maxClosureSize, 0.1))
        .on("click", (_event, d) => setSelectedNode(prev => prev == d.id ? null : d.id))
        .on("mouseover", (_event, d) => setHoveredNode(d.id))
        .on("mouseout", (_event, _d) => setHoveredNode(null))

      node.append("title")
        .text(d => d.id);

      // Add a drag behavior.
      node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

      // Set the position attributes of links and nodes each time the simulation ticks.
      function ticked() {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
      }

      // Reheat the simulation when drag starts, and fix the subject position.
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      // Update the subject (dragged node) position during drag.
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      // Restore the target alpha so the simulation cools after dragging ends.
      // Unfix the subject position now that it’s no longer being dragged.
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return svg.node();
    }

    let chart = ForceGraph(graphState)
    let displaySvg = document.getElementById('svg')

    if (displaySvg.innerHTML === '') {
      displaySvg.appendChild(chart)
    }

  }, [graphState, zoomable])

  const displayConnectedNodes = (key) =>
    graphState.outNeighbors(key).map((neighbor) =>
      <div
        onMouseOver={() => setHoveredNode(neighbor)}
        onMouseOut={() => setHoveredNode(null)}
        onClick={() => setSelectedNode(neighbor)}
        className='app__sidebar--connectedNode' key={neighbor}>
        <p className='app__sidebar--connectedNode--label'>{graphState.getNodeAttribute(neighbor, "label")}</p>
      </div>
    )

  const displayNeededByNodes = (key) =>
    graphState.inNeighbors(key).map((neighbor) =>
      <div
        onMouseOver={() => setHoveredNode(neighbor)}
        onMouseOut={() => setHoveredNode(null)}
        onClick={() => setSelectedNode(neighbor)}
        className='app__sidebar--connectedNode' key={neighbor}>
        <p className='app__sidebar--connectedNode--label'>{graphState.getNodeAttribute(neighbor, "label")}</p>
      </div>
    )

  //Zooming and Panning functions

  const handleZoom = function(e) {
    d3.selectAll('g').attr('transform', e.transform)
  }

  zoomable.scaleExtent([0.25, 10]).on('zoom', handleZoom)

  const zoomIn = function() {
    d3.select('svg').call(zoomable.scaleBy, 2)
  }

  const zoomOut = function() {
    d3.select('svg').call(zoomable.scaleBy, 0.5)
  }

  const panLeft = function() {
    d3.select('svg').call(zoomable.translateBy, -50, 0)
  }

  const panRight = function() {
    d3.select('svg').call(zoomable.translateBy, 50, 0)
  }

  useEffect(() => {
    d3.selectAll('circle')
      .attr("stroke", (d) => d.id == hoveredNode ? "#ccc" : "#fff")
      .style("fill", (d) => {
        if (d.id == selectedNode) {
          return "#0f0"
        }
        if (selectedNode && graphState.inNeighbors(selectedNode).includes(d.id)) {
          return "#f66"
        }
        if (selectedNode && graphState.outNeighbors(selectedNode).includes(d.id)) {
          return "#a00"
        }
        return "#000"
      })
  }, [graphState, hoveredNode, selectedNode])

  const resetDisplaySVG = function() {
    let displaySvg = document.getElementById('svg')
    displaySvg.innerHTML = '';
    return
  }

  const renderAttrs = (id) => {
    return <div className='app__sidebar--attributes'>
      <h3>Attributes</h3>
      <p key="id">id: {id}</p>
      {Object.entries(graphState.getNodeAttributes(id)).map(([key, value]) => { return <p key={key}>{key}: {value}</p> })}
    </div>
  }

  const importGexf = function(event) {
    let fileReader = new FileReader()
    let file = event.target.files[0]
    fileReader.onload = () => setGraphState(gexf.parse(Graph, fileReader.result))
    if (file) {
      resetDisplaySVG()
      fileReader.readAsText(file)
    }
    else {
      console.log('Problem with parsing file import')
    }
    return
  }

  return (
    <div className='app'>
      <Head>
      </Head>

      <div className="app__sidebar">
        <h1 className='app__sidebar--title'>GraphWork</h1>
        <input type="file" onChange={(e) => { importGexf(e) }} accept=".gexf" />
        <div className="app__sidebar--controls">
          <h2>Controls</h2>
          <div>
            <button onClick={zoomOut}>Out</button>
            <span>Zoom</span>
            <button onClick={zoomIn}>In</button>
          </div>
          <div>
            <button onClick={panLeft}>Left</button>
            <span>Pan</span>
            <button onClick={panRight}>Right</button>
          </div>
        </div>
        <h2 className='app__sidebar--subtitle'>Selected Node</h2>
        <p>{selectedNode && graphState.getNodeAttribute(selectedNode, "label")}</p>
        {selectedNode && renderAttrs(selectedNode)}
        <div>
          <h2 className='app__sidebar--subtitle'>Connected nodes</h2>
          <div className="app__sidebar__connectedNodes">
            {selectedNode ? displayConnectedNodes(selectedNode) : ''}
          </div>
        </div>
        <div>
          <h2 className='app__sidebar--subtitle'>needed by nodes</h2>
          <div className="app__sidebar__connectedNodes">
            {selectedNode ? displayNeededByNodes(selectedNode) : ''}
          </div>
        </div>
      </div>
      <div className='app__svg' id="svg">
      </div>
    </div>
  )
}
