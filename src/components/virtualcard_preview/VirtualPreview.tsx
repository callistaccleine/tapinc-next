"use client";

import Image from "next/image";
import React from "react";
import Template1 from "./Template1"; 
import Template2 from "./Template2";
import Template3 from "./Template3";
import styles from "../../styles/VirtualPreview.module.css";
import { CardData } from "@/types/CardData";

export default function VirtualPreview({ data }: { data: CardData }) {
  switch (data.template) {
    case "template1_blank.svg":
      return <Template1 data={data} />;
    case "template2_blank.svg":
      return <Template2 data={data} />;
    case "template3_blank.svg":
      return <Template3 data={data} />;
    default:
      return <p>No template found</p>;
  }
}

