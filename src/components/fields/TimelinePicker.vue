<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import * as d3 from "d3";

type Props = {
  dates: Date[];
  modelValue: Date | null;
  width?: number;
  height?: number;
};

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 72,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: Date): void;
}>();

const svgRef = ref<SVGSVGElement | null>(null);

const sortedDates = computed(() =>
  [...props.dates]
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime())
);

function sameDate(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getTime() === b.getTime();
}

function formatDate(d: Date) {
  return d3.timeFormat("%Y-%m-%d")(d);
}

function draw() {
  if (!svgRef.value || !sortedDates.value.length) return;

  const width = props.width;
  const height = props.height;
  const margin = { left: 24, right: 24 };
  const y = height / 2;

  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();

  const min = sortedDates.value[0];
  const max = sortedDates.value[sortedDates.value.length - 1];

  const x = d3
    .scaleTime()
    .domain(min.getTime() === max.getTime()
      ? [new Date(min.getTime() - 86400000), new Date(max.getTime() + 86400000)]
      : [min, max]
    )
    .range([margin.left, width - margin.right]);

  svg
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y)
    .attr("y2", y)
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", 2);

  const points = svg
    .selectAll<SVGGElement, Date>("g.point")
    .data(sortedDates.value, (d: any) => d.getTime())
    .join("g")
    .attr("class", "point")
    .attr("transform", (d) => `translate(${x(d)}, ${y})`)
    .style("cursor", "pointer")
    .on("click", (_, d) => emit("update:modelValue", d));

  points
    .append("circle")
    .attr("r", (d) => (sameDate(d, props.modelValue) ? 7 : 5))
    .attr("fill", (d) => (sameDate(d, props.modelValue) ? "#2563eb" : "#94a3b8"));

  points
    .append("text")
    .text((d) => formatDate(d))
    .attr("text-anchor", "middle")
    .attr("y", -12)
    .attr("font-size", 12)
    .attr("fill", (d) => (sameDate(d, props.modelValue) ? "#2563eb" : "#475569"));
}

onMounted(draw);
watch(() => [props.dates, props.modelValue, props.width, props.height], draw, { deep: true });
</script>

<template>
  <svg ref="svgRef" :width="width" :height="height" />
</template>
