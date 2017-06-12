<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text" indent="no" encoding="utf-8" media-type="application/json"/>

  <xsl:param name="delim" select="','" />
  <xsl:param name="quote" select="'&quot;'" />
  <xsl:param name="break" select="'&#xA;'" />

  <!-- Main template for escaping strings; used by above template and for object-properties 
       Responsibilities: placed quotes around string, and chain up to next filter, escape-bs-string -->
  <xsl:template name="escape-string">
    <xsl:param name="s"/>
    <xsl:text>"</xsl:text>
    <xsl:call-template name="escape-bs-string">
      <xsl:with-param name="s" select="$s"/>
    </xsl:call-template>
    <xsl:text>"</xsl:text>
  </xsl:template>
  
  <!-- Escape the backslash (\) before everything else. -->
  <xsl:template name="escape-bs-string">
    <xsl:param name="s"/>
    <xsl:choose>
      <xsl:when test="contains($s,'\')">
        <xsl:call-template name="escape-quot-string">
          <xsl:with-param name="s" select="concat(substring-before($s,'\'),'\\')"/>
        </xsl:call-template>
        <xsl:call-template name="escape-bs-string">
          <xsl:with-param name="s" select="substring-after($s,'\')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="escape-quot-string">
          <xsl:with-param name="s" select="$s"/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- Escape the double quote ("). -->
  <xsl:template name="escape-quot-string">
    <xsl:param name="s"/>
    <xsl:choose>
      <xsl:when test="contains($s,'&quot;')">
        <xsl:call-template name="encode-string">
          <xsl:with-param name="s" select="concat(substring-before($s,'&quot;'),'\&quot;')"/>
        </xsl:call-template>
        <xsl:call-template name="escape-quot-string">
          <xsl:with-param name="s" select="substring-after($s,'&quot;')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="encode-string">
          <xsl:with-param name="s" select="$s"/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- Replace tab, line feed and/or carriage return by its matching escape code. Can't escape backslash
       or double quote here, because they don't replace characters (&#x0; becomes \t), but they prefix 
       characters (\ becomes \\). Besides, backslash should be seperate anyway, because it should be 
       processed first. This function can't do that. -->
  <xsl:template name="encode-string">
    <xsl:param name="s"/>
    <xsl:choose>
      <!-- tab -->
      <xsl:when test="contains($s,'&#x9;')">
        <xsl:call-template name="encode-string">
          <xsl:with-param name="s" select="concat(substring-before($s,'&#x9;'),'\t',substring-after($s,'&#x9;'))"/>
        </xsl:call-template>
      </xsl:when>
      <!-- line feed -->
      <xsl:when test="contains($s,'&#xA;')">
        <xsl:call-template name="encode-string">
          <xsl:with-param name="s" select="concat(substring-before($s,'&#xA;'),'\n',substring-after($s,'&#xA;'))"/>
        </xsl:call-template>
      </xsl:when>
      <!-- carriage return -->
      <xsl:when test="contains($s,'&#xD;')">
        <xsl:call-template name="encode-string">
          <xsl:with-param name="s" select="concat(substring-before($s,'&#xD;'),'\r',substring-after($s,'&#xD;'))"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise><xsl:value-of select="$s"/></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="everything">
    <xsl:text>{</xsl:text>
    <xsl:apply-templates select="*"/>
    <xsl:text>}</xsl:text>
  </xsl:template>
  <!--

    <root>
      <a>value A</a>
      <b>value B1</b>
      <b>value B2</b>
    </root>

    {
      "root": {
        "a": "value A",
        "b": [
          "value B1",
          "value B2"
        ]
      }
    }

    Limitation:
    #1 xml elements at the same level which construct an array 
       (with the same element name) must be following siblings.
  -->
  <xsl:template match="*">
    <xsl:variable name="localName" select="local-name()" />
    <xsl:variable name="cnt" select="count(../*[local-name()=$localName])"/>
    <xsl:variable name="isArray" select="$cnt > 1" />

    <xsl:choose>
      <xsl:when test="$isArray">
        <xsl:variable name="idx" select="count(preceding-sibling::*[local-name()=$localName]) + 1"/>
        <xsl:variable name="isLast" select="(number($cnt) - number($idx)) = 0"/>
        <!-- arrary's 1st element -->
        <xsl:if test="$idx = 1">
          <!-- "name": -->
          <xsl:value-of select="concat($quote, local-name(), $quote, ': [')" />
        </xsl:if>
        <!-- { object } or "string" -->
        <xsl:choose>
          <xsl:when test="count(child::*) > 0">
            { <xsl:apply-templates select="*"/> }
          </xsl:when>
          <xsl:otherwise>
            <xsl:variable name="escaped">
              <xsl:call-template name="escape-string">
                <xsl:with-param name="s" select="text()"/>
              </xsl:call-template>
            </xsl:variable>
            <xsl:value-of select="$escaped"/>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:if test="$isLast">]</xsl:if>
      </xsl:when>
      <xsl:otherwise>
        <!-- "name": -->
        <xsl:value-of select="concat($quote, local-name(), $quote, ': ')" />

        <!-- { object } or "string" -->
        <xsl:choose>
          <xsl:when test="count(child::*) > 0">
            { <xsl:apply-templates select="*"/> }
          </xsl:when>
          <xsl:otherwise>
            <xsl:variable name="escaped">
              <xsl:call-template name="escape-string">
                <xsl:with-param name="s" select="text()"/>
              </xsl:call-template>
            </xsl:variable>
            <xsl:value-of select="$escaped"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:if test="following-sibling::*">
      <xsl:text>,</xsl:text>
    </xsl:if>


  </xsl:template>

<!--
  <xsl:template match="text()">
    <xsl:call-template name="escape-string">
      <xsl:with-param name="s" select="."/>
    </xsl:call-template>
  </xsl:template>
-->
</xsl:stylesheet>
